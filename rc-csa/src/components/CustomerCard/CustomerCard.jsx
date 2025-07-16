/* CustomerCard.jsx – Tailwind/CSS version for rc-csa */
import React from "react";
import { PrimaryButton } from '@commercetools-frontend/ui-kit';

const CustomerCard = ({
  customer,
  orders,
  onViewOrder,
}) => {
  const handleViewOrder = (id) => {
    if (onViewOrder) {
      onViewOrder(id);
    } else {
      // Default behavior - could navigate to order details
      console.log('View order:', id);
    }
  };

  const summary = (label, value) => (
    <div className="summary-item">
      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: '500' }}>
        {value}
      </div>
    </div>
  );

  const Header = ({ title, className = "" }) => (
    <th style={{ 
      padding: '0.75rem', 
      textAlign: 'left', 
      fontSize: '0.75rem', 
      fontWeight: '600', 
      color: '#64748b', 
      textTransform: 'uppercase', 
      letterSpacing: '0.05em',
      borderBottom: '1px solid #e2e8f0'
    }} className={className}>
      {title}
    </th>
  );

  const Cell = ({ children }) => (
    <td style={{ 
      padding: '0.75rem', 
      fontSize: '0.875rem', 
      borderBottom: '1px solid #f1f5f9' 
    }}>
      {children}
    </td>
  );

  return (
    <div style={{
      maxWidth: '1024px',
      margin: '0 auto',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Customer Summary */}
      <section style={{ 
        padding: '2rem', 
        borderBottom: '1px solid #e2e8f0' 
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: '#1e293b', 
          marginBottom: '1.5rem' 
        }}>
          Customer Summary
        </h2>

        <div style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          {summary("Name", customer.name)}
          {summary("Email", customer.email)}
          {summary("Phone", customer.phone)}
          {summary("Role", customer.role)}
          {summary("Account Created", customer.accountCreated)}
          {summary("Last Modified", customer.lastModified)}
          {summary("Email Verification", customer.emailVerified)}
          {summary("Onboarding Status", customer.onboardingStatus)}
          {summary("Marketing Consent", customer.marketingConsent || "Not Provided")}
        </div>
      </section>

      {/* Order History */}
      <section style={{ padding: '2rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: '#1e293b', 
          marginBottom: '1.5rem' 
        }}>
          Order History
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            fontSize: '0.875rem', 
            borderCollapse: 'collapse' 
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#f8fafc', 
                color: '#64748b' 
              }}>
                <Header title="Order #" />
                <Header title="Total" />
                <Header title="State" />
                <Header title="Date" />
                <Header title="Items" />
                <Header title="Action" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ 
                  borderBottom: '1px solid #f1f5f9' 
                }}>
                  <Cell>{order.orderNumber}</Cell>
                  <Cell>{order.totalPrice}</Cell>
                  <Cell>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: order.orderState === 'Open' ? '#dbeafe' : '#f3f4f6',
                      color: order.orderState === 'Open' ? '#1e40af' : '#374151'
                    }}>
                      {order.orderState}
                    </span>
                  </Cell>
                  <Cell>{order.date}</Cell>
                  <Cell>{order.itemCount}</Cell>
                  <Cell>
                    <PrimaryButton
                      size="small"
                      onClick={() => handleViewOrder(order.id)}
                      label="View"
                    />
                  </Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#64748b' 
          }}>
            No orders found for this customer.
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerCard;
