document.addEventListener("DOMContentLoaded", function () {
    const content = document.getElementById("content");
    const userHeader = document.getElementById("user-header");
    let error = '';

    function renderLoginPage() {
        content.innerHTML = `
            <div class="login-container">
                <input type="text" id="username" placeholder="Username">
                <input type="password" id="password" placeholder="Password">
                <button id="login-button">Login</button>
                <div id="error-message">${error}</div>
            </div>
        `;
        document.getElementById("login-button").addEventListener("click", handleLogin);
    }

    function handleLogin() {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        fetch('https://bever-aca-assignment.azurewebsites.net/users')
            .then(function (response) {
                return response.json();
            })
            .then(function (users) {
                const user = users.value.find(function (u) {
                    return u.Name === username && u.Password === password;
                });
                if (user) {
                    localStorage.setItem('loggedInUser', JSON.stringify(user));
                    error = '';
                    renderUserHeader();
                    renderInvoicesPage();
                } else {
                    error = 'Invalid username or password';
                    renderLoginPage();
                }
            });
    }

    function renderUserHeader() {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

        if (loggedInUser) {
            userHeader.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${loggedInUser.Name.slice(0, 2)}</div>
                    <span>${loggedInUser.Name}</span>
                    <div class="logout-dropdown">
                        <button id="logout-button">Logout</button>
                    </div>
                </div>
            `;
            document.getElementById("logout-button").addEventListener("click", handleLogout);
        } else {
            userHeader.innerHTML = '<span>Welcome, Guest</span>';
        }
    }

    function handleLogout() {
        localStorage.removeItem('loggedInUser');
        renderUserHeader();
        renderLoginPage();
    }

    function renderInvoicesPage() {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

        fetch('https://bever-aca-assignment.azurewebsites.net/invoices')
            .then(function (response) {
                return response.json();
            })
            .then(function (invoices) {
                const userInvoices = invoices.value.filter(function (invoice) {
                    return invoice.UserId === loggedInUser.UserId;
                });

                content.innerHTML = `
                    <div class="invoices-container">
                        <table class="invoices-table">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Invoice Name</th>
                                    <th>Paid Date</th>
                                    <th>Total Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${userInvoices.map(function (invoice) {
                    return `
                                        <tr>
                                            <td><input type="radio" name="invoice" value="${invoice.InvoiceId}"></td>
                                            <td>${invoice.Name}</td>
                                            <td>${invoice.PaidDate}</td>
                                            <td id="total-amount-${invoice.InvoiceId}"></td>
                                        </tr>
                                    `;
                }).join('')}
                            </tbody>
                        </table>
                        <div id="invoice-lines-container"></div>
                    </div>
                `;

                userInvoices.forEach(function (invoice) {
                    calculateTotalAmount(invoice.InvoiceId);
                });

                document.querySelectorAll('input[name="invoice"]').forEach(function (radio) {
                    radio.addEventListener('change', function (event) {
                        const invoiceId = event.target.value;
                        renderInvoiceLines(invoiceId);
                    });
                });
            });
    }

    function calculateTotalAmount(invoiceId) {
        fetch('https://bever-aca-assignment.azurewebsites.net/invoicelines')
            .then(function (response) {
                return response.json();
            })
            .then(function (invoiceLines) {
                fetch('https://bever-aca-assignment.azurewebsites.net/products')
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (products) {
                        const lines = invoiceLines.value.filter(function (line) {
                            return line.InvoiceId === invoiceId;
                        });
                        const totalAmount = lines.reduce(function (total, line) {
                            const product = products.value.find(function (p) {
                                return p.ProductId === line.ProductId;
                            });
                            return total + (product.Price * line.Quantity);
                        }, 0);
                        document.getElementById(`total-amount-${invoiceId}`).innerText = totalAmount.toFixed(2);
                    });
            });
    }

    function renderInvoiceLines(invoiceId) {
        fetch('https://bever-aca-assignment.azurewebsites.net/invoicelines')
            .then(function (response) {
                return response.json();
            })
            .then(function (invoiceLines) {
                fetch('https://bever-aca-assignment.azurewebsites.net/products')
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (products) {
                        const lines = invoiceLines.value.filter(function (line) {
                            return line.InvoiceId === invoiceId;
                        });

                        document.getElementById("invoice-lines-container").innerHTML = `
                            <table class="invoice-lines-table">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${lines.map(function (line) {
                            const product = products.value.find(function (p) {
                                return p.ProductId === line.ProductId;
                            });
                            return `
                                            <tr>
                                                <td>${product.Name}</td>
                                                <td>${line.Quantity}</td>
                                                <td>${product.Price}</td>
                                                <td>${(product.Price * line.Quantity).toFixed(2)}</td>
                                            </tr>
                                        `;
                        }).join('')}
                                </tbody>
                            </table>
                        `;
                    });
            });
    }

    if (localStorage.getItem('loggedInUser')) {
        renderUserHeader();
        renderInvoicesPage();
    } else {
        renderLoginPage();
    }
});
