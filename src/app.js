const express = require('express');
const app = express();
app.use(express.json());

let todos = [];

// ⚠️ Vulnerabilidad intencional: eval() — el SAST la detectará
app.get('/eval', (req, res) => {
  const result = eval(req.query.code);
  res.json({ result });
});

app.get('/todos', (req, res) => {
  res.json(todos);
});

app.post('/todos', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const todo = { id: todos.length + 1, title, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  todos = todos.filter(t => t.id !== id);
  res.json({ message: 'Deleted' });
});

module.exports = app;