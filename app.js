const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const getUpdatedTodosArray = (todosArray) => {
  const updatedTodosArray = todosArray.map((todoObject) => {
    const updatedTodoObject = {
      id: todoObject.id,
      todo: todoObject.todo,
      priority: todoObject.priority,
      status: todoObject.status,
      category: todoObject.category,
      dueDate: todoObject.due_date,
    };
    return updatedTodoObject;
  });
  return updatedTodosArray;
};

//GET Todos API
app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;
  if (status !== "" && priority === "" && category === "" && search_q === "") {
    //GET Todos of a Status "TO DO"
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
      const todosArray = await db.all(getTodosQuery);
      const updatedTodosArray = getUpdatedTodosArray(todosArray);
      response.send(updatedTodosArray);
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (
    status === "" &&
    priority !== "" &&
    category === "" &&
    search_q === ""
  ) {
    //GET Todos of Priority "HIGH"
    if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
      const getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
      const todosArray = await db.all(getTodosQuery);
      const updatedTodosArray = getUpdatedTodosArray(todosArray);
      response.send(updatedTodosArray);
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (
    status !== "" &&
    priority !== "" &&
    category === "" &&
    search_q === ""
  ) {
    //GET Todos of Status "IN PROGRESS" AND Priority "HIGH"
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        const getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
        const todosArray = await db.all(getTodosQuery);
        const updatedTodosArray = getUpdatedTodosArray(todosArray);
        response.send(updatedTodosArray);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (
    status === "" &&
    priority === "" &&
    category === "" &&
    search_q !== ""
  ) {
    //GET Todos of "Buy" IN todo
    const getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
    const todosArray = await db.all(getTodosQuery);
    const updatedTodosArray = getUpdatedTodosArray(todosArray);
    response.send(updatedTodosArray);
  } else if (
    status !== "" &&
    priority === "" &&
    category !== "" &&
    search_q === ""
  ) {
    //GET Todos of Status "DONE" AND Category "WORK"
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND category = '${category}';`;
        const todosArray = await db.all(getTodosQuery);
        const updatedTodosArray = getUpdatedTodosArray(todosArray);
        response.send(updatedTodosArray);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (
    status === "" &&
    priority === "" &&
    category !== "" &&
    search_q === ""
  ) {
    //GET Todos of Category "HOME"
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
      const todosArray = await db.all(getTodosQuery);
      const updatedTodosArray = getUpdatedTodosArray(todosArray);
      response.send(updatedTodosArray);
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (
    status === "" &&
    priority !== "" &&
    category !== "" &&
    search_q === ""
  ) {
    //GET Todos of Priority "HIGH" AND Category "LEARNING"
    if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND category = '${category}';`;
        const todosArray = await db.all(getTodosQuery);
        const updatedTodosArray = getUpdatedTodosArray(todosArray);
        response.send(updatedTodosArray);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
});

//GET Todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  const updatedTodo = {
    id: todo.id,
    todo: todo.todo,
    status: todo.status,
    priority: todo.priority,
    category: todo.category,
    dueDate: todo.due_date,
  };
  response.send(updatedTodo);
});

//GET Todos of Given Date API
//GET Todos of Given Date API
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const year = date.split("-")[0];
  const month = date.split("-")[1];
  const day = date.split("-")[2];
  if (year.length < 4 || month > 12 || day > 31) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formattedDate = format(
      new Date(parseInt(year), parseInt(month - 1), parseInt(day)),
      "yyyy-MM-dd"
    );
    const getTodosQuery = `SELECT * FROM todo WHERE due_date = '${formattedDate}';`;
    const todosArray = await db.all(getTodosQuery);
    const updatedTodosArray = getUpdatedTodosArray(todosArray);
    response.send(updatedTodosArray);
  }
});

//ADD Todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const year = dueDate.split("-")[0];
  const month = dueDate.split("-")[1];
  const date = dueDate.split("-")[2];
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (year.length < 4 || month > 12 || date > 31) {
          response.status(400);
          response.send("Invalid Due Date");
        } else {
          const formattedDate = format(
            new Date(parseInt(year), parseInt(month - 1), parseInt(date)),
            "yyyy-MM-dd"
          );
          const addTodoQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date )
                  VALUES(${id}, '${todo}', '${priority}', '${status}', '${category}', '${formattedDate}');`;
          await db.run(addTodoQuery);
          response.send("Todo Successfully Added");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

//UPDATE Todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const {
    todo = "",
    status = "",
    priority = "",
    category = "",
    dueDate = "",
  } = request.body;
  if (
    todo === "" &&
    status === "" &&
    priority === "" &&
    category === "" &&
    dueDate !== ""
  ) {
    const year = dueDate.split("-")[0];
    const month = dueDate.split("-")[1];
    const date = dueDate.split("-")[2];
    if (year.length < 4 || month < 1 || month > 12 || date > 31) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const formattedDate = format(
        new Date(parseInt(year), parseInt(month) - 1, parseInt(date)),
        "yyyy-MM-dd"
      );
      const updateTodoQuery = `UPDATE todo SET due_date = '${formattedDate}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
    }
  } else if (
    todo !== "" &&
    status === "" &&
    priority === "" &&
    category === "" &&
    dueDate === ""
  ) {
    const updateTodoQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (
    status !== "" &&
    priority === "" &&
    category === "" &&
    dueDate === ""
  ) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const updateTodoQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (
    priority !== "" &&
    status === "" &&
    category === "" &&
    dueDate === ""
  ) {
    if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
      const updateTodoQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (
    category !== "" &&
    status === "" &&
    priority === "" &&
    dueDate === ""
  ) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const updateTodoQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    // Handle other update scenarios if needed
  }
});

//DELETE Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
