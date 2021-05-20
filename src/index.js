const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const userIndex = users.findIndex((user) => user.username === username);
  const notFound = userIndex === -1;

  if (notFound) {
    return response.status(400).json({ error: "User not found" });
  }

  request.user = users[userIndex];
  request.userIndex = userIndex;
  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;
  const userExists = users.find((user) => user.username === username);

  if (userExists) {
    return response.status(400).json({ error: "User already exists" });
  }

  const user = { id: uuidv4(), name, username, todos: [] };
  users.push(user);
  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  return response.status(200).json(users[request.userIndex].todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline, done } = request.body;
  const todo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: done ? true : false,
    created_at: new Date(),
  };

  users[request.userIndex].todos.push(todo);

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { title, deadline, done } = request.body;
  const todoIndex = request.user.todos.findIndex((todo) => todo.id === id);
  const notFound = todoIndex === -1;

  if (notFound) {
    return response.status(404).json({ error: "Todo not found" });
  }

  const userTodo = request.user.todos[todoIndex];
  userTodo.title = title || userTodo.title;
  userTodo.done = done ? true : false;
  userTodo.deadline = deadline ? new Date(deadline) : userTodo.deadline;
  users[request.userIndex].todos[todoIndex] = userTodo;

  return response.status(200).json(users[request.userIndex].todos[todoIndex]);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;

  const todoIndex = request.user.todos.findIndex((todo) => todo.id === id);
  const notFound = todoIndex === -1;

  if (notFound) {
    return response.status(404).json({ error: "Todo not found" });
  }

  const userTodo = request.user.todos[todoIndex];
  userTodo.done = !userTodo.done;
  users[request.userIndex].todos[todoIndex] = userTodo;
  return response.status(200).json(userTodo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const todoIndex = request.user.todos.findIndex((todo) => todo.id === id);

  const notFound = todoIndex === -1;

  if (notFound) {
    return response.status(404).json({ error: "Todo not found" });
  }

  users[request.userIndex].todos = request.user.todos.filter(
    (item) => item.id !== id
  );
  return response.sendStatus(204);
});

module.exports = app;
