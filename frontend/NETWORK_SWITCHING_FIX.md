# Network Switching Issue - Fixed

## Problem

You were seeing a "Switch Network" modal even though your wallet was connected. This happened because:

1. **Your wallet was connected to a different network** (e.g., Ethereum Mainnet, Polygon, etc.)
2. **The app only supports Lisk Sepolia** (Chain ID: 4202)
3. **Reown AppKit automatically shows a modal** when it detects the wallet is on an unsupported network

## Solution

I've implemented two fixes:

### 1. NetworkGuard Component

A new `NetworkGuard` component that:
- Automatically detects if you're on the wrong network
- Prompts you to switch to Lisk Sepolia
- Shows a user-friendly message instead of just the AppKit modal
- Automatically attempts to switch networks when possible

### 2. Default Chain Configuration

Updated `Web3Provider` to set Lisk Sepolia as the default chain, which helps with initial connections.

## How It Works Now

1. **When you connect your wallet:**
   - If you're already on Lisk Sepolia → Everything works normally ✅
   - If you're on a different network → NetworkGuard shows a message and attempts to switch

2. **The AppKit modal:**
   - You may still see AppKit's "Switch Network" modal
   - This is normal - you can either:
     - Click "Lisk Sepolia" in the AppKit modal, OR
     - Wait for NetworkGuard to automatically switch

3. **After switching:**
   - The NetworkGuard will detect the correct network
   - The app will work normally

## Manual Network Switch

If automatic switching doesn't work, you can manually switch:

1. **Click the "Lisk Sepolia" button** in the top navigation (if visible)
2. **Or use your wallet** to switch networks:
   - MetaMask: Click the network name → Select "Lisk Sepolia"
   - Other wallets: Use their network switching UI

## Adding Lisk Sepolia to Your Wallet

If Lisk Sepolia isn't in your wallet yet, you may need to add it manually:

### MetaMask:
1. Open MetaMask
2. Click the network dropdown
3. Click "Add Network" or "Add a network manually"
4. Enter these details:
   - **Network Name:** Lisk Sepolia
   - **RPC URL:** https://rpc.sepolia.lisk.com
   - **Chain ID:** 4202
   - **Currency Symbol:** LSK
   - **Block Explorer:** https://sepolia-blockscout.lisk.com

### Other Wallets:
Similar process - add a custom network with the details above.

## Testing

To test the fix:

1. Connect your wallet while on a different network (e.g., Ethereum Mainnet)
2. You should see the NetworkGuard message
3. Click "Switch to Lisk Sepolia"
4. Approve the network switch in your wallet
5. The app should now work correctly

## Files Changed

- `frontend/src/app/components/NetworkGuard.tsx` - New component
- `frontend/src/app/layout.tsx` - Added NetworkGuard wrapper
- `frontend/src/app/contexts/Web3Provider.tsx` - Added default chain

## Troubleshooting

If you're still seeing issues:

1. **Check your wallet's current network:**
   - Look at your wallet extension/UI
   - Make sure it shows "Lisk Sepolia" or Chain ID 4202

2. **Clear browser cache:**
   - Sometimes cached network state can cause issues
   - Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

3. **Disconnect and reconnect:**
   - Disconnect your wallet from the app
   - Switch to Lisk Sepolia in your wallet
   - Reconnect to the app

4. **Check console for errors:**
   - Open browser DevTools (F12)
   - Check the Console tab for any errors
   - Share any errors you see

## Why This Happens

This is a common issue in Web3 apps because:
- Users often have their wallets set to popular networks (Ethereum Mainnet, Polygon, etc.)
- Each dApp needs to specify which networks it supports
- Wallets don't automatically switch networks for security reasons
- Users need to explicitly approve network switches

The NetworkGuard component makes this process smoother by:
- Detecting the issue automatically
- Providing clear instructions
- Attempting automatic switching when possible


