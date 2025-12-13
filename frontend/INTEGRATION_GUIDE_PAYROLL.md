# PayrollPlatform Integration Guide

This guide explains how to integrate the PayrollPlatform contract with your frontend application.

## Overview

The integration uses:
- **wagmi** for wallet connection and contract interactions
- **React Query** for data fetching and caching
- **TypeScript** for type safety
- **viem** for low-level Ethereum interactions

## Architecture

```
┌─────────────────┐
│   React Hooks   │  ← Easy-to-use hooks for components
│  (usePayroll)   │
└────────┬────────┘
         │
┌────────▼────────┐
│  PayrollService │  ← Service layer with business logic
└────────┬────────┘
         │
┌────────▼────────┐
│  wagmi/viem     │  ← Web3 library for contract calls
└────────┬────────┘
         │
┌────────▼────────┐
│  PayrollPlatform │  ← Smart contract on Lisk Sepolia
│    Contract      │
└──────────────────┘
```

## Quick Start

### 1. Register as an Employer

```tsx
import { useRegisterEmployer, useWaitForTransaction } from '@/hooks/usePayroll';
import { useAccount } from 'wagmi';

function RegisterEmployerForm() {
  const { address } = useAccount();
  const registerEmployer = useRegisterEmployer();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  
  const { isLoading: isWaiting } = useWaitForTransaction(hash);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const txHash = await registerEmployer.mutateAsync({
        companyName: 'Acme Corp',
        email: 'contact@acme.com',
        location: 'San Francisco, CA',
        signers: [address!], // Array of signer addresses
        threshold: 1, // Number of signatures required
      });
      
      setHash(txHash);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={registerEmployer.isPending || isWaiting}
      >
        {registerEmployer.isPending ? 'Registering...' : 'Register Employer'}
      </button>
    </form>
  );
}
```

### 2. Register as an Employee

```tsx
import { useRegisterEmployee } from '@/hooks/usePayroll';

function RegisterEmployeeForm() {
  const registerEmployee = useRegisterEmployee();

  const handleSubmit = async (data: {
    name: string;
    email: string;
    location: string;
  }) => {
    try {
      await registerEmployee.mutateAsync(data);
      // Success! Query will automatically refetch
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        location: formData.get('location') as string,
      });
    }}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={registerEmployee.isPending}
      >
        {registerEmployee.isPending ? 'Registering...' : 'Register Employee'}
      </button>
    </form>
  );
}
```

### 3. Read Employer Profile

```tsx
import { useEmployerProfile } from '@/hooks/usePayroll';

function EmployerDashboard() {
  const { data: employer, isLoading, error } = useEmployerProfile();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!employer) return <div>Not registered as employer</div>;

  return (
    <div>
      <h1>{employer.companyName}</h1>
      <p>Email: {employer.email}</p>
      <p>Location: {employer.location}</p>
      <p>Wallet: {employer.wallet}</p>
      <p>Registered: {employer.createdAt.toLocaleDateString()}</p>
    </div>
  );
}
```

### 4. Read Employee Profile

```tsx
import { useEmployeeProfile } from '@/hooks/usePayroll';

function EmployeeDashboard() {
  const { data: employee, isLoading, error } = useEmployeeProfile();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!employee) return <div>Not registered as employee</div>;

  return (
    <div>
      <h1>{employee.name}</h1>
      <p>Email: {employee.email}</p>
      <p>Location: {employee.location}</p>
      <p>Registered: {employee.createdAt.toLocaleDateString()}</p>
    </div>
  );
}
```

### 5. Check Registration Status

```tsx
import { useIsEmployerRegistered, useIsEmployeeRegistered } from '@/hooks/usePayroll';

function RegistrationStatus() {
  const { data: isEmployer } = useIsEmployerRegistered();
  const { data: isEmployee } = useIsEmployeeRegistered();

  return (
    <div>
      <p>Employer: {isEmployer ? '✅ Registered' : '❌ Not registered'}</p>
      <p>Employee: {isEmployee ? '✅ Registered' : '❌ Not registered'}</p>
    </div>
  );
}
```

## Available Hooks

### Query Hooks (Read Operations)

- `useEmployerProfile()` - Get current user's employer profile
- `useEmployeeProfile(address?)` - Get employee profile by address
- `useIsEmployerRegistered()` - Check if current user is registered as employer
- `useIsEmployeeRegistered()` - Check if current user is registered as employee
- `useReadEmployer(address)` - Read employer data directly from contract
- `useReadEmployee(address)` - Read employee data directly from contract

### Mutation Hooks (Write Operations)

- `useRegisterEmployer()` - Register as an employer
- `useRegisterEmployee()` - Register as an employee
- `useWaitForTransaction(hash)` - Wait for transaction confirmation

## Service Layer

The `PayrollService` class provides lower-level methods if you need more control:

```tsx
import { payrollService } from '@/services/payrollService';
import { usePublicClient } from 'wagmi';

function CustomComponent() {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const fetchEmployer = async () => {
    if (!address || !publicClient) return;
    
    const employer = await payrollService.getEmployer(
      address,
      publicClient
    );
    
    console.log(employer);
  };

  return <button onClick={fetchEmployer}>Fetch Employer</button>;
}
```

## Type Safety

All types are exported from `@/types/payroll`:

```tsx
import type {
  EmployerFormatted,
  EmployeeProfileFormatted,
  RegisterEmployerParams,
  RegisterEmployeeParams,
} from '@/types/payroll';
```

## Error Handling

All hooks and services include proper error handling:

```tsx
const { data, error, isLoading } = useEmployerProfile();

if (error) {
  // Handle error
  console.error('Failed to fetch employer:', error);
}
```

## Contract Address

The contract address is configured in `src/app/abi/index.tsx`:

```tsx
export const PayrollContract = {
  abi: Payroll,
  address: "0x45CFFa961b1DE99A54DfBD127239Ce2be774Ab84",
};
```

## Best Practices

1. **Always check wallet connection** before calling mutations:
   ```tsx
   const { isConnected } = useAccount();
   if (!isConnected) return <ConnectWallet />;
   ```

2. **Use React Query's loading states** for better UX:
   ```tsx
   if (isLoading) return <LoadingSpinner />;
   ```

3. **Handle errors gracefully**:
   ```tsx
   if (error) return <ErrorMessage error={error} />;
   ```

4. **Invalidate queries after mutations** (automatically handled by hooks):
   - Queries are automatically refetched after successful mutations

5. **Use TypeScript types** for better developer experience:
   ```tsx
   const params: RegisterEmployerParams = {
     companyName: 'Acme Corp',
     // TypeScript will catch missing fields
   };
   ```

## Network Configuration

The contract is deployed on **Lisk Sepolia Testnet** (Chain ID: 4202).

Make sure your wagmi configuration includes this network (already configured in `Web3Provider.tsx`).

## Events

The contract emits the following events:

- `EmployerRegistered(uint256 indexed employerId, address indexed owner, address wallet, string companyName)`
- `EmployeeRegistered(uint256 indexed employeeId, address indexed account, string name)`

You can listen to these events using wagmi's event watching capabilities if needed.

## Next Steps

1. Integrate the hooks into your existing components
2. Add form validation using the service's validation methods
3. Implement proper error handling and user feedback
4. Add transaction status tracking for better UX
5. Consider adding event listeners for real-time updates


