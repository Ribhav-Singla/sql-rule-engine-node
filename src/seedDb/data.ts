export const problems = [
  {
    "problem_id": "Q01",
    "title": "Find Duplicate Emails",
    "pattern": "GROUP BY + HAVING",
    "schema": "ecommerce",
    "query": "SELECT email FROM customers GROUP BY email HAVING COUNT(*) > 1;"
  },
  {
    "problem_id": "Q02",
    "title": "Second Highest Order Value",
    "pattern": "Ranking / subquery / limit-offset",
    "schema": "ecommerce",
    "query": "SELECT MAX(total_amount) FROM orders WHERE total_amount < (SELECT MAX(total_amount) FROM orders);"
  },
  {
    "problem_id": "Q03",
    "title": "Products Above Average Price",
    "pattern": "Subquery",
    "schema": "ecommerce",
    "query": "SELECT product_name FROM products WHERE price > (SELECT AVG(price) FROM products);"
  },
  {
    "problem_id": "Q04",
    "title": "Top 3 Products per Category",
    "pattern": "Window functions",
    "schema": "ecommerce",
    "query": "SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price DESC) AS rank FROM products) t WHERE rank <= 3;"
  },
  {
    "problem_id": "Q05",
    "title": "Customers Who Never Ordered",
    "pattern": "LEFT JOIN + NULL filter",
    "schema": "ecommerce",
    "query": "SELECT c.customer_id FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL;"
  },
  {
    "problem_id": "Q06",
    "title": "Orders with Multiple Items",
    "pattern": "GROUP BY + HAVING",
    "schema": "ecommerce",
    "query": "SELECT order_id, COUNT(product_id) as item_count FROM order_items GROUP BY order_id HAVING COUNT(product_id) > 1;"
  },
  {
    "problem_id": "Q07",
    "title": "Cumulative Revenue",
    "pattern": "Window functions",
    "schema": "ecommerce",
    "query": "SELECT order_date, SUM(total_amount) OVER (ORDER BY order_date) AS running_total FROM orders;"
  },
  {
    "problem_id": "Q08",
    "title": "Total Revenue per Customer",
    "pattern": "Multi-table joins + aggregation",
    "schema": "ecommerce",
    "query": "SELECT c.customer_id, SUM(o.total_amount) AS total_revenue FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id;"
  }
]


export const expectedResults = [
  {
    "problem_id": "Q01",
    "result_hash": "3c1b23065518064d43e58b53ce9f1696d63294086bfdf9a1f3f5f0ec5794a704",
    "result_rows": "[{\"email\":\"mohammed.ali@gmail.com\"}]"
  },
  {
    "problem_id": "Q02",
    "result_hash": "3ef78385c50d08d854bc8c3b36236c20918fc56046869db174839563df4be61f",
    "result_rows": "[{\"max\":\"1299.99\"}]"
  },
  {
    "problem_id": "Q03",
    "result_hash": "64cceecd1f953694388f9cbbc38ad85f379b46dde5c2cbbf3e8374cdedd8ef99",
    "result_rows": "[{\"product_name\":\"Dyson V15 Detect Vacuum\"},{\"product_name\":\"iPhone 15 Pro Max 256GB\"},{\"product_name\":\"KitchenAid Stand Mixer\"},{\"product_name\":\"MacBook Air M3 15-inch\"},{\"product_name\":\"Samsung Galaxy S24 Ultra\"},{\"product_name\":\"Sony WH-1000XM5 Headphones\"}]"
  },
  {
    "problem_id": "Q04",
    "result_hash": "21bad73e25578d876f2f7429fc383afc22f1b00998cdc367bc09e7f11349e5fd",
    "result_rows": "[{\"product_id\":1,\"product_name\":\"iPhone 15 Pro Max 256GB\",\"category_id\":1,\"price\":\"1199.00\",\"stock_quantity\":45,\"brand\":\"Apple\",\"rating\":\"4.7\",\"rank\":\"3\"},{\"product_id\":10,\"product_name\":\"KitchenAid Stand Mixer\",\"category_id\":3,\"price\":\"379.99\",\"stock_quantity\":55,\"brand\":\"KitchenAid\",\"rating\":\"4.8\",\"rank\":\"2\"},{\"product_id\":11,\"product_name\":\"Atomic Habits by James Clear\",\"category_id\":4,\"price\":\"16.99\",\"stock_quantity\":500,\"brand\":\"Penguin\",\"rating\":\"4.9\",\"rank\":\"1\"},{\"product_id\":12,\"product_name\":\"Dune by Frank Herbert\",\"category_id\":4,\"price\":\"14.99\",\"stock_quantity\":320,\"brand\":\"Ace Books\",\"rating\":\"4.7\",\"rank\":\"2\"},{\"product_id\":13,\"product_name\":\"Yoga Mat Premium 6mm\",\"category_id\":5,\"price\":\"34.99\",\"stock_quantity\":400,\"brand\":\"Manduka\",\"rating\":\"4.5\",\"rank\":\"2\"},{\"product_id\":14,\"product_name\":\"Hydro Flask 32oz Water Bottle\",\"category_id\":5,\"price\":\"44.95\",\"stock_quantity\":250,\"brand\":\"Hydro Flask\",\"rating\":\"4.6\",\"rank\":\"1\"},{\"product_id\":15,\"product_name\":\"CeraVe Moisturizing Cream 16oz\",\"category_id\":6,\"price\":\"18.99\",\"stock_quantity\":600,\"brand\":\"CeraVe\",\"rating\":\"4.7\",\"rank\":\"1\"},{\"product_id\":16,\"product_name\":\"Ordinary Niacinamide Serum\",\"category_id\":6,\"price\":\"11.90\",\"stock_quantity\":450,\"brand\":\"The Ordinary\",\"rating\":\"4.4\",\"rank\":\"2\"},{\"product_id\":17,\"product_name\":\"LEGO Star Wars Millennium Falcon\",\"category_id\":7,\"price\":\"169.99\",\"stock_quantity\":60,\"brand\":\"LEGO\",\"rating\":\"4.9\",\"rank\":\"1\"},{\"product_id\":18,\"product_name\":\"Settlers of Catan Board Game\",\"category_id\":7,\"price\":\"44.99\",\"stock_quantity\":150,\"brand\":\"Catan Studio\",\"rating\":\"4.7\",\"rank\":\"2\"},{\"product_id\":19,\"product_name\":\"Lavazza Super Crema Espresso 2.2lb\",\"category_id\":8,\"price\":\"21.99\",\"stock_quantity\":340,\"brand\":\"Lavazza\",\"rating\":\"4.5\",\"rank\":\"2\"},{\"product_id\":2,\"product_name\":\"Samsung Galaxy S24 Ultra\",\"category_id\":1,\"price\":\"1299.99\",\"stock_quantity\":30,\"brand\":\"Samsung\",\"rating\":\"4.6\",\"rank\":\"1\"},{\"product_id\":20,\"product_name\":\"Manuka Honey UMF 15+ 500g\",\"category_id\":8,\"price\":\"54.99\",\"stock_quantity\":80,\"brand\":\"Comvita\",\"rating\":\"4.6\",\"rank\":\"1\"},{\"product_id\":4,\"product_name\":\"MacBook Air M3 15-inch\",\"category_id\":1,\"price\":\"1299.00\",\"stock_quantity\":25,\"brand\":\"Apple\",\"rating\":\"4.9\",\"rank\":\"2\"},{\"product_id\":5,\"product_name\":\"Nike Air Max 270 Running Shoes\",\"category_id\":2,\"price\":\"150.00\",\"stock_quantity\":200,\"brand\":\"Nike\",\"rating\":\"4.4\",\"rank\":\"2\"},{\"product_id\":6,\"product_name\":\"Levi's 501 Original Fit Jeans\",\"category_id\":2,\"price\":\"69.50\",\"stock_quantity\":180,\"brand\":\"Levi's\",\"rating\":\"4.3\",\"rank\":\"3\"},{\"product_id\":7,\"product_name\":\"The North Face Puffer Jacket\",\"category_id\":2,\"price\":\"229.00\",\"stock_quantity\":75,\"brand\":\"The North Face\",\"rating\":\"4.5\",\"rank\":\"1\"},{\"product_id\":8,\"product_name\":\"Instant Pot Duo 7-in-1 (6 Qt)\",\"category_id\":3,\"price\":\"89.95\",\"stock_quantity\":300,\"brand\":\"Instant Pot\",\"rating\":\"4.7\",\"rank\":\"3\"},{\"product_id\":9,\"product_name\":\"Dyson V15 Detect Vacuum\",\"category_id\":3,\"price\":\"749.99\",\"stock_quantity\":40,\"brand\":\"Dyson\",\"rating\":\"4.6\",\"rank\":\"1\"}]"
  },
  {
    "problem_id": "Q05",
    "result_hash": "93062be9b3283d7b353959cba3718b1969ecc9775548d2ff0510385525dffb6a",
    "result_rows": "[{\"customer_id\":19},{\"customer_id\":20}]"
  },
  {
    "problem_id": "Q06",
    "result_hash": "e5dcd9ac9b0115fed2f60e1836a20ed150c15785e88b07f69490866d7a66542e",
    "result_rows": "[{\"order_id\":1,\"item_count\":\"2\"},{\"order_id\":12,\"item_count\":\"2\"},{\"order_id\":4,\"item_count\":\"3\"},{\"order_id\":7,\"item_count\":\"2\"},{\"order_id\":9,\"item_count\":\"2\"}]"
  },
  {
    "problem_id": "Q07",
    "result_hash": "4fcc83eb18ceb023a81391d0d373cc75b83595ad883b979f5fd5e22eba3caec6",
    "result_rows": "[{\"order_date\":\"2024-01-09T18:30:00.000Z\",\"running_total\":\"1548.99\"},{\"order_date\":\"2024-01-17T18:30:00.000Z\",\"running_total\":\"2848.98\"},{\"order_date\":\"2024-02-02T18:30:00.000Z\",\"running_total\":\"3198.97\"},{\"order_date\":\"2024-02-13T18:30:00.000Z\",\"running_total\":\"3438.47\"},{\"order_date\":\"2024-02-29T18:30:00.000Z\",\"running_total\":\"3528.42\"},{\"order_date\":\"2024-03-11T18:30:00.000Z\",\"running_total\":\"4727.42\"},{\"order_date\":\"2024-04-04T18:30:00.000Z\",\"running_total\":\"5152.36\"},{\"order_date\":\"2024-04-19T18:30:00.000Z\",\"running_total\":\"5902.35\"},{\"order_date\":\"2024-05-07T18:30:00.000Z\",\"running_total\":\"5934.33\"},{\"order_date\":\"2024-05-21T18:30:00.000Z\",\"running_total\":\"6084.33\"},{\"order_date\":\"2024-06-09T18:30:00.000Z\",\"running_total\":\"7383.33\"},{\"order_date\":\"2024-06-24T18:30:00.000Z\",\"running_total\":\"7598.31\"},{\"order_date\":\"2024-07-07T18:30:00.000Z\",\"running_total\":\"7667.81\"},{\"order_date\":\"2024-07-18T18:30:00.000Z\",\"running_total\":\"8047.80\"},{\"order_date\":\"2024-08-01T18:30:00.000Z\",\"running_total\":\"8217.79\"},{\"order_date\":\"2024-08-14T18:30:00.000Z\",\"running_total\":\"8262.74\"},{\"order_date\":\"2024-08-31T18:30:00.000Z\",\"running_total\":\"9461.74\"},{\"order_date\":\"2024-09-13T18:30:00.000Z\",\"running_total\":\"9690.74\"},{\"order_date\":\"2024-09-27T18:30:00.000Z\",\"running_total\":\"9745.73\"},{\"order_date\":\"2024-10-04T18:30:00.000Z\",\"running_total\":\"9835.68\"}]"
  },
  {
    "problem_id": "Q08",
    "result_hash": "0759491a60e9e33b5dfca304c10b825bc6108a720e0e92cafd651e5c31937885",
    "result_rows": "[{\"customer_id\":1,\"total_revenue\":\"1603.98\"},{\"customer_id\":10,\"total_revenue\":\"424.94\"},{\"customer_id\":11,\"total_revenue\":\"69.50\"},{\"customer_id\":12,\"total_revenue\":\"31.98\"},{\"customer_id\":13,\"total_revenue\":\"44.95\"},{\"customer_id\":14,\"total_revenue\":\"214.98\"},{\"customer_id\":15,\"total_revenue\":\"379.99\"},{\"customer_id\":16,\"total_revenue\":\"169.99\"},{\"customer_id\":17,\"total_revenue\":\"1199.00\"},{\"customer_id\":18,\"total_revenue\":\"229.00\"},{\"customer_id\":2,\"total_revenue\":\"329.45\"},{\"customer_id\":3,\"total_revenue\":\"1299.99\"},{\"customer_id\":4,\"total_revenue\":\"1199.00\"},{\"customer_id\":5,\"total_revenue\":\"349.99\"},{\"customer_id\":6,\"total_revenue\":\"749.99\"},{\"customer_id\":7,\"total_revenue\":\"150.00\"},{\"customer_id\":8,\"total_revenue\":\"89.95\"},{\"customer_id\":9,\"total_revenue\":\"1299.00\"}]"
  }
]
