# PolarDEX Admin Setup Guide

## Adding Admin Wallet Addresses

### Step 1: Get Your SUI Wallet Address
1. Install [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil) browser extension
2. Create or import your wallet
3. Copy your wallet address (it starts with `0x` and is 64 characters long)
   - Example: `0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

### Step 2: Add Your Address to the Admin Database

#### Option A: Edit JSON File (Development)
1. Open `src/data/admins.json`
2. Add your admin entry to the `admins` array:

```json
{
  "id": "admin-003",
  "walletAddress": "YOUR_SUI_WALLET_ADDRESS_HERE",
  "username": "your-username",
  "email": "your-email@polardex.com",
  "role": "admin",
  "permissions": ["token-management", "revenue-view"],
  "createdAt": "2024-01-01T00:00:00Z",
  "isActive": true
}
```

#### Option B: Environment Variables (Production)
1. Create `.env.local` file in the admin-interface directory
2. Add your addresses:

```env
VITE_ADMIN_WALLET_ADDRESSES=0xYOUR_ADDRESS_1,0xYOUR_ADDRESS_2
VITE_ADMIN_USERNAMES=admin1,admin2
```

### Step 3: Admin Roles and Permissions

**Roles:**
- `super-admin`: Full access to all features
- `admin`: Access to most features
- `moderator`: Limited access

**Permissions:**
- `token-management`: Manage token verification
- `revenue-view`: View revenue analytics
- `dex-metrics`: View DEX metrics

### Step 4: Test Your Setup

1. Start the development server:
   ```bash
   yarn dev
   ```

2. Navigate to the admin login page
3. Click "Connect SUI Wallet"
4. Select your wallet and connect
5. Sign the authentication message when prompted
6. You should be logged into the admin dashboard

### Authentication Flow

1. **Wallet Connection**: User connects their SUI wallet
2. **Address Verification**: System checks if wallet address is authorized
3. **Message Signing**: User signs an authentication message to prove ownership
4. **Access Granted**: User gains access to admin features based on their role

### Security Features

- **Message Signing**: Proves wallet ownership without blockchain transactions
- **Role-Based Access**: Different permission levels for different admins
- **Session Management**: Secure session storage and logout
- **Address Validation**: Ensures only authorized wallets can access admin features

### Troubleshooting

**"Wallet address not authorized"**
- Check that your wallet address is correctly added to `admins.json`
- Ensure the address format is correct (0x + 64 hex characters)
- Verify `isActive` is set to `true`

**"No SUI wallet found"**
- Install Sui Wallet browser extension
- Make sure the wallet is unlocked
- Refresh the page and try again

**Authentication fails**
- Check browser console for error messages
- Ensure wallet is properly connected
- Try disconnecting and reconnecting

### Production Deployment

For production:
1. Use environment variables instead of JSON files
2. Implement proper signature verification
3. Add database integration for admin management
4. Set up proper logging and monitoring

### Adding New Admins (For Super Admins)

1. Get the new admin's SUI wallet address
2. Add them to the admin database with appropriate role and permissions
3. Notify them of their access and provide this setup guide
4. Test their access before granting production permissions

## Support

For technical support or questions about admin setup, contact the development team.