import express from "express";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const customers = [];

//Middleware
function verifyIfExistisAccountCPF(req, res, next) {
  const { cpf } = req.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    res.status(400).json({ error: "Customer not found" });
  }

  req.customer = customer;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.get("/statement", verifyIfExistisAccountCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.get("/statement/date", verifyIfExistisAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.get("/account", verifyIfExistisAccountCPF, (req, res) => {
  const { customer } = req;
  res.json(customer);
});

app.get("/balance", verifyIfExistisAccountCPF, (req, res) => {
  const { customer } = req;
  const balance = getBalance(customer.statement);

  return res.json(balance);
});

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;
  const customerAlredyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlredyExists) {
    return res.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  res.status(201).send();
});

app.post("/deposit", verifyIfExistisAccountCPF, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;

  const customerOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };
  customer.statement.push(customerOperation);

  return res.status(201).send();
});

app.post("/withdraw", verifyIfExistisAccountCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;
  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient funds!" });
  }

  const statementeOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementeOperation);

  return res.status(201).send();
});

app.put("/account", verifyIfExistisAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return res.status(201).send();
});

app.delete("/account", verifyIfExistisAccountCPF, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(200).json(customers);
});

app.listen(3333);

//21
