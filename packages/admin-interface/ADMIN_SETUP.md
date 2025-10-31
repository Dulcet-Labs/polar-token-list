# PolarDEX Admin Interface

## For Authorized Admins Only

This admin interface is restricted to authorized PolarDEX team members only. Admin access is granted by the core team and cannot be self-assigned.

## Getting Admin Access

**Admin access is invitation-only.** If you believe you should have admin access:

1. Contact the PolarDEX core team through official channels
2. Provide your SUI wallet address when requested
3. Wait for manual approval and setup by the team
4. You will be notified when access is granted

## Using the Admin Interface

Once you have been granted admin access:

### Admin Roles and Permissions

**Roles:**
- `super-admin`: Full access to all features
- `admin`: Access to most features
- `moderator`: Limited access

**Permissions:**
- `token-management`: Manage token verification
- `revenue-view`: View revenue analytics
- `dex-metrics`: View DEX metrics

### Accessing the Admin Dashboard

1. Navigate to the admin interface
2. Click "Connect SUI Wallet"
3. Select your authorized wallet and connect
4. Sign the authentication message when prompted
5. You will be logged into the admin dashboard if your wallet is authorized

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
- Your wallet address has not been granted admin access
- Contact the PolarDEX team if you believe this is an error
- Only authorized team members can access the admin interface

**"No SUI wallet found"**
- Install Sui Wallet browser extension
- Make sure the wallet is unlocked
- Refresh the page and try again

**Authentication fails**
- Check browser console for error messages
- Ensure wallet is properly connected
- Try disconnecting and reconnecting

### For Core Team Members Only

Admin access management is restricted to core team members. If you need to grant admin access to someone:

1. Verify their identity and authorization level
2. Contact the technical team for wallet address setup
3. Test their access in a development environment first
4. Monitor their access and permissions regularly

## Support

For technical support or questions about admin setup, contact the development team.