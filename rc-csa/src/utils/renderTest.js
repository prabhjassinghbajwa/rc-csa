/**
 * Test file to debug HTML rendering issues
 */

// Sample MCP HTML response to test
const sampleMcpHtml = `
<div class="customer-card">
  <section>
    <h2>Customer Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <p class="label">Name</p>
        <p class="val">John Doe</p>
      </div>
      <div class="summary-item">
        <p class="label">Email</p>
        <p class="val">john.doe@example.com</p>
      </div>
    </div>
  </section>
  <section>
    <h2>Recent Orders</h2>
    <table class="order-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Date</th>
          <th>Total</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>12345</td>
          <td>2024-01-15</td>
          <td>$99.99</td>
          <td>
            <button onclick="document.getElementById('messageInput').value='Show order details for 12345'; document.querySelector('form').submit()">
              View →
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</div>
`;

console.log("Sample HTML:", sampleMcpHtml);
console.log("HTML starts with <:", sampleMcpHtml.trim().startsWith('<'));
console.log("HTML includes >:", sampleMcpHtml.includes('>'));
console.log("HTML includes div:", sampleMcpHtml.includes('<div'));

export { sampleMcpHtml };
