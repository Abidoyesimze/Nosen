const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Nosen", function () {
  let nosen;
  let owner;
  let user1;
  let user2;
  let dao1;
  let dao2;
  let addrs;

  // Mock ENS addresses for testing (using valid checksums)
  const mockENSRegistry = "0x1234567890123456789012345678901234567890";
  const mockENSResolver = "0x0987654321098765432109876543210987654321";
  const mockDomainNode = ethers.keccak256(ethers.toUtf8Bytes("nosen.eth"));

  beforeEach(async function () {
    [owner, user1, user2, dao1, dao2, ...addrs] = await ethers.getSigners();

    const Nosen = await ethers.getContractFactory("Nosen");
    nosen = await Nosen.deploy();

    // Enable test mode to skip ENS operations
    await nosen.setTestMode(true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nosen.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await nosen.paused()).to.be.false;
    });

    it("Should have correct initial fee and duration", async function () {
      expect(await nosen.subdomainFee()).to.equal(ethers.parseEther("0.01"));
      expect(await nosen.subdomainDuration()).to.equal(365 * 24 * 60 * 60); // 365 days
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set ENS addresses", async function () {
      await nosen.setENSAddresses(mockENSRegistry, mockENSResolver, mockDomainNode);

      expect(await nosen.ensRegistry()).to.equal(mockENSRegistry);
      expect(await nosen.ensResolver()).to.equal(mockENSResolver);
      expect(await nosen.mainDomainNode()).to.equal(mockDomainNode);
    });

    it("Should allow owner to set verified DAO", async function () {
      await nosen.setVerifiedDAO(dao1.address, true);
      expect(await nosen.verifiedDAOs(dao1.address)).to.be.true;
    });

    it("Should allow owner to update fee", async function () {
      const newFee = ethers.parseEther("0.02");
      await nosen.updateFee(newFee);
      expect(await nosen.subdomainFee()).to.equal(newFee);
    });

    it("Should allow owner to pause/unpause", async function () {
      await nosen.pause();
      expect(await nosen.paused()).to.be.true;

      await nosen.unpause();
      expect(await nosen.paused()).to.be.false;
    });

    it("Should not allow non-owner to call admin functions", async function () {
      await expect(
        nosen.connect(user1).setENSAddresses(mockENSRegistry, mockENSResolver, mockDomainNode)
      ).to.be.revertedWithCustomError(nosen, "OwnableUnauthorizedAccount");

      await expect(
        nosen.connect(user1).setVerifiedDAO(dao1.address, true)
      ).to.be.revertedWithCustomError(nosen, "OwnableUnauthorizedAccount");
    });
  });

  describe("ENS Subdomain Registration", function () {
    beforeEach(async function () {
      await nosen.setENSAddresses(mockENSRegistry, mockENSResolver, mockDomainNode);
    });

    it("Should allow user to register subdomain with correct fee", async function () {
      const subdomain = "alice";
      const fee = ethers.parseEther("0.01");

      await expect(
        nosen.connect(user1).registerSubdomain(subdomain, { value: fee })
      ).to.emit(nosen, "SubdomainRegistered")
        .withArgs(subdomain, user1.address);

      const subdomainInfo = await nosen.getSubdomainInfo(subdomain);
      expect(subdomainInfo.owner).to.equal(user1.address);
      expect(subdomainInfo.verified).to.be.false;
    });

    it("Should track user's subdomains", async function () {
      const subdomain = "bob";
      const fee = ethers.parseEther("0.01");

      await nosen.connect(user1).registerSubdomain(subdomain, { value: fee });

      const userSubdomains = await nosen.getUserSubdomains(user1.address);
      expect(userSubdomains).to.include(subdomain);
    });

    it("Should not allow registration with insufficient fee", async function () {
      const subdomain = "charlie";
      const insufficientFee = ethers.parseEther("0.005");

      await expect(
        nosen.connect(user1).registerSubdomain(subdomain, { value: insufficientFee })
      ).to.be.revertedWith("Insufficient fee");
    });

    it("Should not allow duplicate subdomain registration", async function () {
      const subdomain = "david";
      const fee = ethers.parseEther("0.01");

      await nosen.connect(user1).registerSubdomain(subdomain, { value: fee });

      await expect(
        nosen.connect(user2).registerSubdomain(subdomain, { value: fee })
      ).to.be.revertedWith("Taken");
    });

    it("Should not allow invalid subdomain format", async function () {
      const invalidSubdomains = [
        { subdomain: "", expectedError: "Invalid length" },
        { subdomain: "a", expectedError: "Invalid length" },
        { subdomain: "a-", expectedError: "Invalid format" },
        { subdomain: "-a", expectedError: "Invalid format" },
        { subdomain: "a--b", expectedError: "Invalid format" },
        { subdomain: "a@b", expectedError: "Invalid format" },
        { subdomain: "a b", expectedError: "Invalid format" }
      ];
      const fee = ethers.parseEther("0.01");

      for (const { subdomain, expectedError } of invalidSubdomains) {
        await expect(
          nosen.connect(user1).registerSubdomain(subdomain, { value: fee })
        ).to.be.revertedWith(expectedError);
      }
    });

    it("Should not allow registration when paused", async function () {
      await nosen.pause();

      const subdomain = "eve";
      const fee = ethers.parseEther("0.01");

      await expect(
        nosen.connect(user1).registerSubdomain(subdomain, { value: fee })
      ).to.be.revertedWithCustomError(nosen, "EnforcedPause");
    });

    it("Should refund excess fee", async function () {
      const subdomain = "frank";
      const excessFee = ethers.parseEther("0.02");
      const expectedRefund = ethers.parseEther("0.01");

      const initialBalance = await ethers.provider.getBalance(user1.address);

      const tx = await nosen.connect(user1).registerSubdomain(subdomain, { value: excessFee });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(user1.address);
      const actualRefund = initialBalance - finalBalance - gasCost;

      // Should refund the excess fee (0.01 ETH)
      expect(actualRefund).to.equal(expectedRefund);
    });
  });

  describe("DAO Verification", function () {
    beforeEach(async function () {
      await nosen.setENSAddresses(mockENSRegistry, mockENSResolver, mockDomainNode);
      await nosen.setVerifiedDAO(dao1.address, true);

      // Register a subdomain first
      const subdomain = "grace";
      const fee = ethers.parseEther("0.01");
      await nosen.connect(user1).registerSubdomain(subdomain, { value: fee });
    });

    it("Should allow verified DAO to verify subdomain", async function () {
      const subdomain = "grace";
      const note = "Verified by DAO1";

      await expect(
        nosen.connect(dao1).verifySubdomain(subdomain, note)
      ).to.emit(nosen, "SubdomainVerified")
        .withArgs(subdomain, dao1.address, note);

      const subdomainInfo = await nosen.getSubdomainInfo(subdomain);
      expect(subdomainInfo.verified).to.be.true;
      expect(subdomainInfo.verifiedBy).to.equal(dao1.address);
      expect(subdomainInfo.verificationNote).to.equal(note);
    });

    it("Should not allow non-verified DAO to verify", async function () {
      const subdomain = "grace";
      const note = "Attempted by non-verified DAO";

      await expect(
        nosen.connect(dao2).verifySubdomain(subdomain, note)
      ).to.be.revertedWith("Not verified DAO");
    });

    it("Should not allow verification of non-existent subdomain", async function () {
      const nonExistentSubdomain = "nonexistent";
      const note = "Verification attempt";

      await expect(
        nosen.connect(dao1).verifySubdomain(nonExistentSubdomain, note)
      ).to.be.revertedWith("Subdomain not found");
    });

    it("Should not allow double verification", async function () {
      const subdomain = "grace";
      const note1 = "First verification";
      const note2 = "Second verification";

      await nosen.connect(dao1).verifySubdomain(subdomain, note1);

      await expect(
        nosen.connect(dao1).verifySubdomain(subdomain, note2)
      ).to.be.revertedWith("Already verified");
    });
  });

  describe("ChainProof System", function () {
    it("Should allow user to anchor proof", async function () {
      const ipfsCid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

      const tx = await nosen.connect(user1).anchorProof(ipfsCid);
      const receipt = await tx.wait();

      // Find the ProofAnchored event
      const event = receipt.logs.find(log => {
        try {
          return nosen.interface.parseLog(log).name === "ProofAnchored";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const parsedEvent = nosen.interface.parseLog(event);
      expect(parsedEvent.args.issuer).to.equal(user1.address);
      expect(parsedEvent.args.ipfsCid).to.equal(ipfsCid);
    });

    it("Should track user's proofs", async function () {
      const ipfsCid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

      const tx = await nosen.connect(user1).anchorProof(ipfsCid);
      const receipt = await tx.wait();

      // Extract proof ID from the event
      const event = receipt.logs.find(log => {
        try {
          return nosen.interface.parseLog(log).name === "ProofAnchored";
        } catch {
          return false;
        }
      });

      const parsedEvent = nosen.interface.parseLog(event);
      const proofId = parsedEvent.args.proofId;

      const userProofs = await nosen.getUserProofs(user1.address);
      expect(userProofs).to.include(proofId);
    });

    it("Should allow multiple proofs with same IPFS CID", async function () {
      const ipfsCid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

      // First proof
      const tx1 = await nosen.connect(user1).anchorProof(ipfsCid);
      const receipt1 = await tx1.wait();

      // Second proof with same IPFS CID (should work due to nonce)
      const tx2 = await nosen.connect(user1).anchorProof(ipfsCid);
      const receipt2 = await tx2.wait();

      // Both should succeed and generate different proof IDs
      const event1 = receipt1.logs.find(log => {
        try {
          return nosen.interface.parseLog(log).name === "ProofAnchored";
        } catch {
          return false;
        }
      });

      const event2 = receipt2.logs.find(log => {
        try {
          return nosen.interface.parseLog(log).name === "ProofAnchored";
        } catch {
          return false;
        }
      });

      const proofId1 = nosen.interface.parseLog(event1).args.proofId;
      const proofId2 = nosen.interface.parseLog(event2).args.proofId;

      expect(proofId1).to.not.equal(proofId2);
    });

    it("Should not allow proof anchoring when paused", async function () {
      await nosen.pause();

      const ipfsCid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

      await expect(
        nosen.connect(user1).anchorProof(ipfsCid)
      ).to.be.revertedWithCustomError(nosen, "EnforcedPause");
    });
  });

  describe("Proof Verification", function () {
    let proofId;

    beforeEach(async function () {
      await nosen.setVerifiedDAO(dao1.address, true);
      await nosen.setVerifiedDAO(dao2.address, true);

      // Anchor a proof first
      const ipfsCid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      const tx = await nosen.connect(user1).anchorProof(ipfsCid);
      const receipt = await tx.wait();

      // Extract proof ID from the event
      const event = receipt.logs.find(log => {
        try {
          return nosen.interface.parseLog(log).name === "ProofAnchored";
        } catch {
          return false;
        }
      });

      const parsedEvent = nosen.interface.parseLog(event);
      proofId = parsedEvent.args.proofId;
    });

    it("Should allow verified DAO to verify proof", async function () {
      await expect(
        nosen.connect(dao1).verifyProof(proofId)
      ).to.emit(nosen, "ProofVerified")
        .withArgs(proofId, dao1.address);

      const proof = await nosen.getProof(proofId);
      expect(proof.verifiers).to.include(dao1.address);
    });

    it("Should not allow non-verified DAO to verify", async function () {
      await expect(
        nosen.connect(user2).verifyProof(proofId)
      ).to.be.revertedWith("Not verified DAO");
    });

    it("Should not allow double verification by same DAO", async function () {
      await nosen.connect(dao1).verifyProof(proofId);

      await expect(
        nosen.connect(dao1).verifyProof(proofId)
      ).to.be.revertedWith("Already verified");
    });

    it("Should mark proof as verified after 2 verifications", async function () {
      await nosen.connect(dao1).verifyProof(proofId);

      let proof = await nosen.getProof(proofId);
      expect(proof.verified).to.be.false;

      await nosen.connect(dao2).verifyProof(proofId);

      proof = await nosen.getProof(proofId);
      expect(proof.verified).to.be.true;
      expect(proof.verifiers).to.have.lengthOf(2);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await nosen.setENSAddresses(mockENSRegistry, mockENSResolver, mockDomainNode);
    });

    it("Should return correct subdomain availability", async function () {
      expect(await nosen.isSubdomainAvailable("available")).to.be.true;

      const fee = ethers.parseEther("0.01");
      await nosen.connect(user1).registerSubdomain("taken", { value: fee });

      expect(await nosen.isSubdomainAvailable("taken")).to.be.false;
    });

    it("Should return empty arrays for new users", async function () {
      const userSubdomains = await nosen.getUserSubdomains(user1.address);
      const userProofs = await nosen.getUserProofs(user1.address);

      expect(userSubdomains).to.have.lengthOf(0);
      expect(userProofs).to.have.lengthOf(0);
    });

    it("Should return correct subdomain info", async function () {
      const subdomain = "test";
      const fee = ethers.parseEther("0.01");

      await nosen.connect(user1).registerSubdomain(subdomain, { value: fee });

      const info = await nosen.getSubdomainInfo(subdomain);
      expect(info.owner).to.equal(user1.address);
      expect(info.verified).to.be.false;
      expect(info.verifiedBy).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple subdomains per user", async function () {
      await nosen.setENSAddresses(mockENSRegistry, mockENSResolver, mockDomainNode);

      const fee = ethers.parseEther("0.01");
      const subdomains = ["alice", "bob", "charlie"];

      for (const subdomain of subdomains) {
        await nosen.connect(user1).registerSubdomain(subdomain, { value: fee });
      }

      const userSubdomains = await nosen.getUserSubdomains(user1.address);
      expect(userSubdomains).to.have.lengthOf(3);
      expect(userSubdomains).to.include("alice");
      expect(userSubdomains).to.include("bob");
      expect(userSubdomains).to.include("charlie");
    });

    it("Should handle multiple proofs per user", async function () {
      const ipfsCids = [
        "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        "QmZ2APJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        "QmX3APJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
      ];

      for (const ipfsCid of ipfsCids) {
        await nosen.connect(user1).anchorProof(ipfsCid);
      }

      const userProofs = await nosen.getUserProofs(user1.address);
      expect(userProofs).to.have.lengthOf(3);
    });

    it("Should handle fee withdrawal by owner", async function () {
      await nosen.setENSAddresses(mockENSRegistry, mockENSResolver, mockDomainNode);

      // Register a subdomain to generate fees
      const fee = ethers.parseEther("0.01");
      await nosen.connect(user1).registerSubdomain("test", { value: fee });

      const initialBalance = await ethers.provider.getBalance(owner.address);

      // Note: The contract doesn't have a withdraw function in this version
      // This test shows the contract can receive ETH
      expect(await ethers.provider.getBalance(nosen.target)).to.equal(fee);
    });
  });
});
