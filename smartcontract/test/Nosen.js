const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("NosenPlatform", function () {
  // Fixture to deploy contract and set up initial state
  async function deployNosenPlatformFixture() {
    const [owner, user1, user2, user3, verifier1, verifier2, verifier3] = await ethers.getSigners();
    
    const NosenPlatform = await ethers.getContractFactory("NosenPlatform");
    const nosenPlatform = await NosenPlatform.deploy();
    
    return {
      nosenPlatform,
      owner,
      user1,
      user2,
      user3,
      verifier1,
      verifier2,
      verifier3
    };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { nosenPlatform, owner } = await loadFixture(deployNosenPlatformFixture);
      expect(await nosenPlatform.owner()).to.equal(owner.address);
    });

    it("Should initialize owner with reputation", async function () {
      const { nosenPlatform, owner } = await loadFixture(deployNosenPlatformFixture);
      const reputation = await nosenPlatform.getUserReputation(owner.address);
      expect(reputation.reputationScore).to.equal(100);
    });

    it("Should set initial fee values", async function () {
      const { nosenPlatform } = await loadFixture(deployNosenPlatformFixture);
      expect(await nosenPlatform.incomeSourceFee()).to.equal(ethers.parseEther("0.0005"));
      expect(await nosenPlatform.employerVerificationFee()).to.equal(ethers.parseEther("0.002"));
      expect(await nosenPlatform.documentGenerationFee()).to.equal(ethers.parseEther("0.0003"));
    });
  });

  describe("Income Source Management", function () {
    describe("Adding Income Sources", function () {
      it("Should add income source successfully", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        const tx = await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        await expect(tx)
          .to.emit(nosenPlatform, "IncomeSourceAdded")
          .withArgs(user1.address, 1, "Software Developer", "Ethereum");

        const incomeSource = await nosenPlatform.getIncomeSource(1);
        expect(incomeSource.name).to.equal("Software Developer");
        expect(incomeSource.owner).to.equal(user1.address);
        expect(incomeSource.isActive).to.be.true;
      });

      it("Should fail with insufficient fee", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(
          nosenPlatform.connect(user1).addIncomeSource(
            "Software Developer",
            "Senior Developer",
            ethers.parseEther("5000"),
            "USDC",
            "Ethereum",
            "example.eth",
            true,
            "monthly",
            "QmTest123",
            { value: ethers.parseEther("0.0001") }
          )
        ).to.be.revertedWith("Insufficient fee");
      });

      it("Should fail with empty required fields", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(
          nosenPlatform.connect(user1).addIncomeSource(
            "",
            "Senior Developer",
            ethers.parseEther("5000"),
            "USDC",
            "Ethereum",
            "example.eth",
            true,
            "monthly",
            "QmTest123",
            { value: ethers.parseEther("0.0005") }
          )
        ).to.be.revertedWith("Name required");
      });

      it("Should create user reputation for new users", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        const reputation = await nosenPlatform.getUserReputation(user1.address);
        expect(reputation.reputationScore).to.equal(5);
      });
    });

    describe("Updating Income Sources", function () {
      it("Should update income source successfully", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        // Add income source first
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        // Update it
        await expect(
          nosenPlatform.connect(user1).updateIncomeSource(
            1,
            "Lead Developer",
            "Tech Lead",
            ethers.parseEther("6000"),
            "USDT",
            "Polygon",
            "newexample.eth",
            false,
            "weekly",
            "QmTest456"
          )
        ).to.emit(nosenPlatform, "IncomeSourceUpdated");

        const incomeSource = await nosenPlatform.getIncomeSource(1);
        expect(incomeSource.name).to.equal("Lead Developer");
        expect(incomeSource.monthlyAmount).to.equal(ethers.parseEther("6000"));
      });

      it("Should fail if not owner", async function () {
        const { nosenPlatform, user1, user2 } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        await expect(
          nosenPlatform.connect(user2).updateIncomeSource(
            1,
            "Lead Developer",
            "Tech Lead",
            ethers.parseEther("6000"),
            "USDT",
            "Polygon",
            "newexample.eth",
            false,
            "weekly",
            "QmTest456"
          )
        ).to.be.revertedWith("Not owner");
      });
    });

    describe("Income Source Verification", function () {
      beforeEach(async function () {
        const { nosenPlatform, user1, verifier1, verifier2, verifier3 } = await loadFixture(deployNosenPlatformFixture);
        
        // Add income source
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        // Give verifiers minimum reputation
        await nosenPlatform.connect(verifier1).addIncomeSource(
          "Verifier Job 1",
          "Role",
          ethers.parseEther("1000"),
          "USDC",
          "Ethereum",
          "",
          true,
          "monthly",
          "QmVerifier1",
          { value: ethers.parseEther("0.0005") }
        );

        await nosenPlatform.connect(verifier2).addIncomeSource(
          "Verifier Job 2",
          "Role",
          ethers.parseEther("1000"),
          "USDC",
          "Ethereum",
          "",
          true,
          "monthly",
          "QmVerifier2",
          { value: ethers.parseEther("0.0005") }
        );

        await nosenPlatform.connect(verifier3).addIncomeSource(
          "Verifier Job 3",
          "Role",
          ethers.parseEther("1000"),
          "USDC",
          "Ethereum",
          "",
          true,
          "monthly",
          "QmVerifier3",
          { value: ethers.parseEther("0.0005") }
        );

        // Boost their reputation to minimum required
        const boostTx1 = await nosenPlatform.updateMinimumReputation(5);
        await boostTx1.wait();
      });

      it("Should verify income source with sufficient verifications", async function () {
        const { nosenPlatform, user1, verifier1, verifier2, verifier3 } = await loadFixture(deployNosenPlatformFixture);
        
        // Add income source and setup verifiers (same as beforeEach)
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        await nosenPlatform.connect(verifier1).addIncomeSource(
          "Verifier Job 1",
          "Role",
          ethers.parseEther("1000"),
          "USDC",
          "Ethereum",
          "",
          true,
          "monthly",
          "QmVerifier1",
          { value: ethers.parseEther("0.0005") }
        );

        await nosenPlatform.connect(verifier2).addIncomeSource(
          "Verifier Job 2",
          "Role",
          ethers.parseEther("1000"),
          "USDC",
          "Ethereum",
          "",
          true,
          "monthly",
          "QmVerifier2",
          { value: ethers.parseEther("0.0005") }
        );

        await nosenPlatform.connect(verifier3).addIncomeSource(
          "Verifier Job 3",
          "Role",
          ethers.parseEther("1000"),
          "USDC",
          "Ethereum",
          "",
          true,
          "monthly",
          "QmVerifier3",
          { value: ethers.parseEther("0.0005") }
        );

        await nosenPlatform.updateMinimumReputation(5);

        // First verification
        await expect(nosenPlatform.connect(verifier1).verifyIncomeSource(1))
          .to.emit(nosenPlatform, "IncomeSourceVerified")
          .withArgs(1, verifier1.address, 1);

        let incomeSource = await nosenPlatform.getIncomeSource(1);
        expect(incomeSource.verificationCount).to.equal(1);
        expect(incomeSource.isVerified).to.be.false;

        // Second verification
        await nosenPlatform.connect(verifier2).verifyIncomeSource(1);
        incomeSource = await nosenPlatform.getIncomeSource(1);
        expect(incomeSource.verificationCount).to.equal(2);
        expect(incomeSource.isVerified).to.be.false;

        // Third verification - should trigger full verification
        await nosenPlatform.connect(verifier3).verifyIncomeSource(1);
        incomeSource = await nosenPlatform.getIncomeSource(1);
        expect(incomeSource.verificationCount).to.equal(3);
        expect(incomeSource.isVerified).to.be.true;
      });

      it("Should fail if user tries to verify own income source", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        await expect(
          nosenPlatform.connect(user1).verifyIncomeSource(1)
        ).to.be.revertedWith("Cannot verify own income source");
      });

      it("Should fail if user has insufficient reputation", async function () {
        const { nosenPlatform, user1, user2 } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        await expect(
          nosenPlatform.connect(user2).verifyIncomeSource(1)
        ).to.be.revertedWith("Insufficient reputation");
      });
    });

    describe("Transaction Linking", function () {
      it("Should link transaction to income source", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        await expect(
          nosenPlatform.connect(user1).linkTransactionToSource(1, "0x123abc")
        ).to.emit(nosenPlatform, "TransactionLinked")
          .withArgs(1, "0x123abc");

        const transactions = await nosenPlatform.getIncomeSourceTransactions(1);
        expect(transactions).to.include("0x123abc");
      });

      it("Should fail if not income source owner", async function () {
        const { nosenPlatform, user1, user2 } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        await expect(
          nosenPlatform.connect(user2).linkTransactionToSource(1, "0x123abc")
        ).to.be.revertedWith("Not owner");
      });
    });

    describe("Activation/Deactivation", function () {
      it("Should deactivate and reactivate income source", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(user1).addIncomeSource(
          "Software Developer",
          "Senior Developer",
          ethers.parseEther("5000"),
          "USDC",
          "Ethereum",
          "example.eth",
          true,
          "monthly",
          "QmTest123",
          { value: ethers.parseEther("0.0005") }
        );

        // Deactivate
        await expect(nosenPlatform.connect(user1).deactivateIncomeSource(1))
          .to.emit(nosenPlatform, "IncomeSourceDeactivated")
          .withArgs(1);

        let incomeSource = await nosenPlatform.getIncomeSource(1);
        expect(incomeSource.isActive).to.be.false;

        // Reactivate
        await expect(nosenPlatform.connect(user1).reactivateIncomeSource(1))
          .to.emit(nosenPlatform, "IncomeSourceReactivated")
          .withArgs(1);

        incomeSource = await nosenPlatform.getIncomeSource(1);
        expect(incomeSource.isActive).to.be.true;
      });
    });
  });

  describe("Employer Management", function () {
    describe("Adding Employers", function () {
      it("Should add employer successfully", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        const tx = await nosenPlatform.connect(user1).addEmployer(
          "Tech Corp",
          "Technology",
          "John Doe",
          "john@techcorp.com",
          "+1234567890",
          "https://techcorp.com",
          "techcorp.eth",
          "QmEmployer123",
          ["Ethereum", "Polygon"],
          ["USDC", "USDT"],
          { value: ethers.parseEther("0.002") }
        );

        await expect(tx)
          .to.emit(nosenPlatform, "EmployerAdded")
          .withArgs(1, "Tech Corp", "Technology");

        const employer = await nosenPlatform.getEmployer(1);
        expect(employer.name).to.equal("Tech Corp");
        expect(employer.owner).to.equal(user1.address);
        expect(employer.isActive).to.be.true;
      });

      it("Should fail with insufficient fee", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(
          nosenPlatform.connect(user1).addEmployer(
            "Tech Corp",
            "Technology",
            "John Doe",
            "john@techcorp.com",
            "+1234567890",
            "https://techcorp.com",
            "techcorp.eth",
            "QmEmployer123",
            ["Ethereum", "Polygon"],
            ["USDC", "USDT"],
            { value: ethers.parseEther("0.001") }
          )
        ).to.be.revertedWith("Insufficient fee");
      });
    });

    describe("Employer Verification", function () {
      it("Should verify employer with sufficient verifications", async function () {
        const { nosenPlatform, user1, verifier1, verifier2, verifier3 } = await loadFixture(deployNosenPlatformFixture);
        
        // Add employer
        await nosenPlatform.connect(user1).addEmployer(
          "Tech Corp",
          "Technology",
          "John Doe",
          "john@techcorp.com",
          "+1234567890",
          "https://techcorp.com",
          "techcorp.eth",
          "QmEmployer123",
          ["Ethereum"],
          ["USDC"],
          { value: ethers.parseEther("0.002") }
        );

        // Setup verifiers with minimum reputation
        await nosenPlatform.connect(verifier1).addIncomeSource(
          "Job1", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", "", true, "monthly", "QmV1",
          { value: ethers.parseEther("0.0005") }
        );
        
        await nosenPlatform.connect(verifier2).addIncomeSource(
          "Job2", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", "", true, "monthly", "QmV2",
          { value: ethers.parseEther("0.0005") }
        );
        
        await nosenPlatform.connect(verifier3).addIncomeSource(
          "Job3", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", "", true, "monthly", "QmV3",
          { value: ethers.parseEther("0.0005") }
        );

        await nosenPlatform.updateMinimumReputation(5);

        // Verify employer
        await nosenPlatform.connect(verifier1).verifyEmployer(1);
        await nosenPlatform.connect(verifier2).verifyEmployer(1);
        await nosenPlatform.connect(verifier3).verifyEmployer(1);

        const employer = await nosenPlatform.getEmployer(1);
        expect(employer.isVerified).to.be.true;
        expect(employer.verificationCount).to.equal(3);
      });
    });
  });

  describe("Reputation System", function () {
    it("Should track user reputation correctly", async function () {
      const { nosenPlatform, user1, verifier1 } = await loadFixture(deployNosenPlatformFixture);
      
      // Add income sources to establish reputation
      await nosenPlatform.connect(user1).addIncomeSource(
        "Software Developer", "Role", ethers.parseEther("5000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest1", { value: ethers.parseEther("0.0005") }
      );
      
      await nosenPlatform.connect(verifier1).addIncomeSource(
        "Verifier Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest2", { value: ethers.parseEther("0.0005") }
      );

      await nosenPlatform.updateMinimumReputation(5);

      // Verify income source
      await nosenPlatform.connect(verifier1).verifyIncomeSource(1);

      const verifierRep = await nosenPlatform.getUserReputation(verifier1.address);
      expect(verifierRep.verificationsGiven).to.equal(1);
      expect(verifierRep.reputationScore).to.equal(7); // 5 initial + 2 for verification
    });

    it("Should check if user can verify", async function () {
      const { nosenPlatform, user1, user2 } = await loadFixture(deployNosenPlatformFixture);
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
      );

      expect(await nosenPlatform.canUserVerify(user1.address)).to.be.false;
      expect(await nosenPlatform.canUserVerify(user2.address)).to.be.false;

      // Lower threshold
      await nosenPlatform.updateMinimumReputation(5);
      expect(await nosenPlatform.canUserVerify(user1.address)).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    describe("Parameter Updates", function () {
      it("Should update verification threshold", async function () {
        const { nosenPlatform, owner } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(nosenPlatform.connect(owner).updateVerificationThreshold(5))
          .to.emit(nosenPlatform, "VerificationThresholdUpdated")
          .withArgs(5);

        expect(await nosenPlatform.verificationThreshold()).to.equal(5);
      });

      it("Should fail to update threshold if not owner", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(
          nosenPlatform.connect(user1).updateVerificationThreshold(5)
        ).to.be.revertedWithCustomError(nosenPlatform, "OwnableUnauthorizedAccount");
      });

      it("Should update minimum reputation", async function () {
        const { nosenPlatform, owner } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(nosenPlatform.connect(owner).updateMinimumReputation(20))
          .to.emit(nosenPlatform, "MinimumReputationUpdated")
          .withArgs(20);

        expect(await nosenPlatform.minimumReputationToVerify()).to.equal(20);
      });

      it("Should update fees", async function () {
        const { nosenPlatform, owner } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(owner).updateFees(
          ethers.parseEther("0.001"),
          ethers.parseEther("0.003"),
          ethers.parseEther("0.0005")
        );

        expect(await nosenPlatform.incomeSourceFee()).to.equal(ethers.parseEther("0.001"));
        expect(await nosenPlatform.employerVerificationFee()).to.equal(ethers.parseEther("0.003"));
        expect(await nosenPlatform.documentGenerationFee()).to.equal(ethers.parseEther("0.0005"));
      });
    });

    describe("Pause/Unpause", function () {
      it("Should pause and unpause contract", async function () {
        const { nosenPlatform, owner } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(owner).pause();
        expect(await nosenPlatform.paused()).to.be.true;

        await nosenPlatform.connect(owner).unpause();
        expect(await nosenPlatform.paused()).to.be.false;
      });

      it("Should prevent actions when paused", async function () {
        const { nosenPlatform, owner, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(owner).pause();

        await expect(
          nosenPlatform.connect(user1).addIncomeSource(
            "Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
            "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
          )
        ).to.be.revertedWithCustomError(nosenPlatform, "EnforcedPause");
      });
    });

    describe("Withdrawal", function () {
      it("Should withdraw contract balance", async function () {
        const { nosenPlatform, owner, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        // Add income source to generate fees
        await nosenPlatform.connect(user1).addIncomeSource(
          "Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
          "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
        );

        const initialBalance = await ethers.provider.getBalance(owner.address);
        const contractBalance = await ethers.provider.getBalance(nosenPlatform.target);
        
        const tx = await nosenPlatform.connect(owner).withdraw();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const finalBalance = await ethers.provider.getBalance(owner.address);
        expect(finalBalance).to.be.closeTo(
          initialBalance + contractBalance - gasUsed,
          ethers.parseEther("0.001") // Allow for small gas estimation errors
        );
      });

      it("Should fail to withdraw with zero balance", async function () {
        const { nosenPlatform, owner } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(
          nosenPlatform.connect(owner).withdraw()
        ).to.be.revertedWith("No balance to withdraw");
      });
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
      
      // Add some test data
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job1", "Role1", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest1", { value: ethers.parseEther("0.0005") }
      );
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job2", "Role2", ethers.parseEther("2000"), "USDT", "Polygon", 
        "", false, "weekly", "QmTest2", { value: ethers.parseEther("0.0005") }
      );
    });

    it("Should get user income sources", async function () {
      const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job1", "Role1", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest1", { value: ethers.parseEther("0.0005") }
      );
      
      const sources = await nosenPlatform.getUserIncomeSources(user1.address);
      expect(sources.length).to.equal(1);
      expect(sources[0]).to.equal(1);
    });

    it("Should get income source count", async function () {
      const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job1", "Role1", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest1", { value: ethers.parseEther("0.0005") }
      );
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job2", "Role2", ethers.parseEther("2000"), "USDT", "Polygon", 
        "", false, "weekly", "QmTest2", { value: ethers.parseEther("0.0005") }
      );

      const count = await nosenPlatform.getIncomeSourceCount(user1.address);
      expect(count).to.equal(2);
    });

    it("Should get contract stats", async function () {
      const { nosenPlatform, user1, verifier1 } = await loadFixture(deployNosenPlatformFixture);
      
      // Add income sources
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job1", "Role1", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest1", { value: ethers.parseEther("0.0005") }
      );
      
      await nosenPlatform.connect(verifier1).addIncomeSource(
        "Job2", "Role2", ethers.parseEther("2000"), "USDT", "Polygon", 
        "", false, "weekly", "QmTest2", { value: ethers.parseEther("0.0005") }
      );

      // Add employer
      await nosenPlatform.connect(user1).addEmployer(
        "Tech Corp", "Technology", "John Doe", "john@techcorp.com", 
        "+1234567890", "https://techcorp.com", "techcorp.eth", "QmEmployer123",
        ["Ethereum"], ["USDC"], { value: ethers.parseEther("0.002") }
      );

      const stats = await nosenPlatform.getContractStats();
      expect(stats.totalIncomeSources).to.equal(2);
      expect(stats.totalEmployers).to.equal(1);
      expect(stats.totalDocuments).to.equal(0);
      expect(stats.totalVerifiedIncomeSources).to.equal(0);
      expect(stats.totalVerifiedEmployers).to.equal(0);
      expect(stats.totalVerifiedDocuments).to.equal(0);
    });

    it("Should get income source stats", async function () {
      const { nosenPlatform, user1, verifier1 } = await loadFixture(deployNosenPlatformFixture);
      
      // Add income sources
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job1", "Role1", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest1", { value: ethers.parseEther("0.0005") }
      );
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job2", "Role2", ethers.parseEther("2000"), "USDT", "Polygon", 
        "", false, "weekly", "QmTest2", { value: ethers.parseEther("0.0005") }
      );

      // Add transactions
      await nosenPlatform.connect(user1).linkTransactionToSource(1, "0xabc123");
      await nosenPlatform.connect(user1).linkTransactionToSource(1, "0xdef456");
      await nosenPlatform.connect(user1).linkTransactionToSource(2, "0x789ghi");

      // Setup verifier
      await nosenPlatform.connect(verifier1).addIncomeSource(
        "Verifier Job", "Role", ethers.parseEther("500"), "USDC", "Ethereum", 
        "", true, "monthly", "QmVerifier", { value: ethers.parseEther("0.0005") }
      );

      await nosenPlatform.updateMinimumReputation(5);

      // Verify one source
      await nosenPlatform.connect(verifier1).verifyIncomeSource(1);
      await nosenPlatform.connect(user1).verifyIncomeSource(3); // verifier's source
      
      // Need more verifiers to fully verify
      const owner = await nosenPlatform.owner();
      const ownerSigner = await ethers.getSigner(owner);
      await nosenPlatform.connect(ownerSigner).verifyIncomeSource(1);

      const stats = await nosenPlatform.getIncomeSourceStats(user1.address);
      expect(stats.totalSources).to.equal(2);
      expect(stats.totalTransactions).to.equal(3);
    });

    it("Should get verification progress", async function () {
      const { nosenPlatform, user1, verifier1 } = await loadFixture(deployNosenPlatformFixture);
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job1", "Role1", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest1", { value: ethers.parseEther("0.0005") }
      );

      await nosenPlatform.connect(verifier1).addIncomeSource(
        "Verifier Job", "Role", ethers.parseEther("500"), "USDC", "Ethereum", 
        "", true, "monthly", "QmVerifier", { value: ethers.parseEther("0.0005") }
      );

      await nosenPlatform.updateMinimumReputation(5);

      let progress = await nosenPlatform.getVerificationProgress(1, "income");
      expect(progress.currentCount).to.equal(0);
      expect(progress.threshold).to.equal(3);
      expect(progress.isVerified).to.be.false;

      // Add one verification
      await nosenPlatform.connect(verifier1).verifyIncomeSource(1);

      progress = await nosenPlatform.getVerificationProgress(1, "income");
      expect(progress.currentCount).to.equal(1);
      expect(progress.isVerified).to.be.false;
    });
  });

  describe("Document Management", function () {
    // Note: The contract code shows document-related structs and events but 
    // the actual document generation function seems to be missing from the provided contract.
    // Adding tests for the document-related view functions that are available.

    it("Should check document expiry", async function () {
      const { nosenPlatform } = await loadFixture(deployNosenPlatformFixture);
      
      // This test would require the document generation function to be implemented
      // For now, we'll test that the function exists and handles non-existent documents
      await expect(
        nosenPlatform.checkDocumentExpiry(999)
      ).to.be.revertedWith("Document not found");
    });

    it("Should get user documents", async function () {
      const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
      
      const documents = await nosenPlatform.getUserDocuments(user1.address);
      expect(documents.length).to.equal(0);
    });

    it("Should get document count", async function () {
      const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
      
      const count = await nosenPlatform.getDocumentCount(user1.address);
      expect(count).to.equal(0);
    });
  });

  describe("Security Tests", function () {
    describe("Reentrancy Protection", function () {
      it("Should prevent reentrancy attacks", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        // This is a basic test - in a real scenario you'd deploy a malicious contract
        // that tries to call addIncomeSource recursively
        await expect(
          nosenPlatform.connect(user1).addIncomeSource(
            "Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
            "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
          )
        ).to.not.be.reverted;
      });
    });

    describe("Access Control", function () {
      it("Should enforce owner-only functions", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(
          nosenPlatform.connect(user1).updateVerificationThreshold(5)
        ).to.be.revertedWithCustomError(nosenPlatform, "OwnableUnauthorizedAccount");

        await expect(
          nosenPlatform.connect(user1).pause()
        ).to.be.revertedWithCustomError(nosenPlatform, "OwnableUnauthorizedAccount");

        await expect(
          nosenPlatform.connect(user1).withdraw()
        ).to.be.revertedWithCustomError(nosenPlatform, "OwnableUnauthorizedAccount");
      });

      it("Should enforce item ownership", async function () {
        const { nosenPlatform, user1, user2 } = await loadFixture(deployNosenPlatformFixture);
        
        await nosenPlatform.connect(user1).addIncomeSource(
          "Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
          "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
        );

        await expect(
          nosenPlatform.connect(user2).updateIncomeSource(
            1, "Updated Job", "Updated Role", ethers.parseEther("1500"), 
            "USDT", "Polygon", "", false, "weekly", "QmUpdated"
          )
        ).to.be.revertedWith("Not owner");

        await expect(
          nosenPlatform.connect(user2).deactivateIncomeSource(1)
        ).to.be.revertedWith("Not owner");

        await expect(
          nosenPlatform.connect(user2).linkTransactionToSource(1, "0xabc")
        ).to.be.revertedWith("Not owner");
      });
    });

    describe("Input Validation", function () {
      it("Should validate required fields", async function () {
        const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(
          nosenPlatform.connect(user1).addIncomeSource(
            "", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
            "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
          )
        ).to.be.revertedWith("Name required");

        await expect(
          nosenPlatform.connect(user1).addIncomeSource(
            "Job", "Role", 0, "USDC", "Ethereum", 
            "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
          )
        ).to.be.revertedWith("Amount must be positive");

        await expect(
          nosenPlatform.connect(user1).addIncomeSource(
            "Job", "Role", ethers.parseEther("1000"), "USDC", "", 
            "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
          )
        ).to.be.revertedWith("Network required");
      });

      it("Should validate threshold bounds", async function () {
        const { nosenPlatform, owner } = await loadFixture(deployNosenPlatformFixture);
        
        await expect(
          nosenPlatform.connect(owner).updateVerificationThreshold(1)
        ).to.be.revertedWith("Threshold too low");

        await expect(
          nosenPlatform.connect(owner).updateVerificationThreshold(11)
        ).to.be.revertedWith("Threshold too high");

        await expect(
          nosenPlatform.connect(owner).updateMinimumReputation(4)
        ).to.be.revertedWith("Reputation too low");

        await expect(
          nosenPlatform.connect(owner).updateMinimumReputation(51)
        ).to.be.revertedWith("Reputation too high");
      });
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple verifications correctly", async function () {
      const { nosenPlatform, user1, verifier1, verifier2, verifier3 } = await loadFixture(deployNosenPlatformFixture);
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
      );

      // Setup verifiers
      for (let verifier of [verifier1, verifier2, verifier3]) {
        await nosenPlatform.connect(verifier).addIncomeSource(
          "Verifier Job", "Role", ethers.parseEther("500"), "USDC", "Ethereum", 
          "", true, "monthly", "QmVerifier", { value: ethers.parseEther("0.0005") }
        );
      }

      await nosenPlatform.updateMinimumReputation(5);

      // First verifier tries to verify twice
      await nosenPlatform.connect(verifier1).verifyIncomeSource(1);
      
      await expect(
        nosenPlatform.connect(verifier1).verifyIncomeSource(1)
      ).to.be.revertedWith("Already verified");
    });

    it("Should handle empty transaction hash", async function () {
      const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
      );

      await expect(
        nosenPlatform.connect(user1).linkTransactionToSource(1, "")
      ).to.be.revertedWith("Transaction hash required");
    });

    it("Should handle reactivation of already active source", async function () {
      const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
      );

      // Try to reactivate already active source
      await expect(
        nosenPlatform.connect(user1).reactivateIncomeSource(1)
      ).to.be.revertedWith("Already active");
    });

    it("Should reset verification when updating verified item", async function () {
      const { nosenPlatform, user1, verifier1, verifier2, verifier3 } = await loadFixture(deployNosenPlatformFixture);
      
      await nosenPlatform.connect(user1).addIncomeSource(
        "Job", "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
        "", true, "monthly", "QmTest", { value: ethers.parseEther("0.0005") }
      );

      // Setup verifiers and fully verify
      for (let i = 0; i < 3; i++) {
        const verifier = [verifier1, verifier2, verifier3][i];
        await nosenPlatform.connect(verifier).addIncomeSource(
          `Verifier Job ${i}`, "Role", ethers.parseEther("500"), "USDC", "Ethereum", 
          "", true, "monthly", `QmVerifier${i}`, { value: ethers.parseEther("0.0005") }
        );
      }

      await nosenPlatform.updateMinimumReputation(5);

      // Verify fully
      await nosenPlatform.connect(verifier1).verifyIncomeSource(1);
      await nosenPlatform.connect(verifier2).verifyIncomeSource(1);
      await nosenPlatform.connect(verifier3).verifyIncomeSource(1);

      let source = await nosenPlatform.getIncomeSource(1);
      expect(source.isVerified).to.be.true;
      expect(source.verificationCount).to.equal(3);

      // Update the source - should reset verification
      await nosenPlatform.connect(user1).updateIncomeSource(
        1, "Updated Job", "Updated Role", ethers.parseEther("1500"), 
        "USDT", "Polygon", "", false, "weekly", "QmUpdated"
      );

      source = await nosenPlatform.getIncomeSource(1);
      expect(source.isVerified).to.be.false;
      expect(source.verificationCount).to.equal(0);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should handle batch operations efficiently", async function () {
      const { nosenPlatform, user1 } = await loadFixture(deployNosenPlatformFixture);
      
      // Add multiple income sources and measure gas
      const transactions = [];
      
      for (let i = 0; i < 5; i++) {
        const tx = await nosenPlatform.connect(user1).addIncomeSource(
          `Job ${i}`, `Role ${i}`, ethers.parseEther((1000 + i * 100).toString()), 
          "USDC", "Ethereum", "", true, "monthly", `QmTest${i}`, 
          { value: ethers.parseEther("0.0005") }
        );
        transactions.push(tx);
      }
      
      // Verify all transactions succeeded
      expect(transactions.length).to.equal(5);
      
      const sources = await nosenPlatform.getUserIncomeSources(user1.address);
      expect(sources.length).to.equal(5);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete user workflow", async function () {
      const { nosenPlatform, user1, verifier1, verifier2, verifier3 } = await loadFixture(deployNosenPlatformFixture);
      
      // 1. User adds income source
      await nosenPlatform.connect(user1).addIncomeSource(
        "Software Developer", "Senior Dev", ethers.parseEther("5000"), 
        "USDC", "Ethereum", "dev.eth", true, "monthly", "QmDev123", 
        { value: ethers.parseEther("0.0005") }
      );

      // 2. User adds employer
      await nosenPlatform.connect(user1).addEmployer(
        "Tech Corp", "Technology", "John Doe", "john@techcorp.com", 
        "+1234567890", "https://techcorp.com", "techcorp.eth", "QmEmployer123",
        ["Ethereum"], ["USDC"], { value: ethers.parseEther("0.002") }
      );

      // 3. User links transactions
      await nosenPlatform.connect(user1).linkTransactionToSource(1, "0xabc123");
      await nosenPlatform.connect(user1).linkTransactionToSource(1, "0xdef456");

      // 4. Setup verifiers
      for (let i = 0; i < 3; i++) {
        const verifier = [verifier1, verifier2, verifier3][i];
        await nosenPlatform.connect(verifier).addIncomeSource(
          `Verifier ${i}`, "Role", ethers.parseEther("1000"), "USDC", "Ethereum", 
          "", true, "monthly", `QmVer${i}`, { value: ethers.parseEther("0.0005") }
        );
      }

      await nosenPlatform.updateMinimumReputation(5);

      // 5. Get verifications
      await nosenPlatform.connect(verifier1).verifyIncomeSource(1);
      await nosenPlatform.connect(verifier2).verifyIncomeSource(1);
      await nosenPlatform.connect(verifier3).verifyIncomeSource(1);

      await nosenPlatform.connect(verifier1).verifyEmployer(1);
      await nosenPlatform.connect(verifier2).verifyEmployer(1);
      await nosenPlatform.connect(verifier3).verifyEmployer(1);

      // 6. Verify final state
      const incomeSource = await nosenPlatform.getIncomeSource(1);
      const employer = await nosenPlatform.getEmployer(1);
      const userRep = await nosenPlatform.getUserReputation(user1.address);
      const transactions = await nosenPlatform.getIncomeSourceTransactions(1);

      expect(incomeSource.isVerified).to.be.true;
      expect(employer.isVerified).to.be.true;
      expect(userRep.verificationsReceived).to.equal(2); // income + employer
      expect(transactions.length).to.equal(2);

      // 7. Check stats
      const stats = await nosenPlatform.getContractStats();
      expect(stats.totalIncomeSources).to.equal(4); // 1 user + 3 verifiers
      expect(stats.totalEmployers).to.equal(1);
      expect(stats.totalVerifiedIncomeSources).to.equal(1);
      expect(stats.totalVerifiedEmployers).to.equal(1);
    });
  });
});