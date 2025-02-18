const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🔹 CREATE Task
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      status = "pending",
      priority = "low",
    } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and Description are required" });
    }

    const task = await Task.create({
      userId: req.user._id,
      title,
      description,
      status,
      priority,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// 🔹 GET Tasks with Filtering, Sorting & Searching
router.get("/", authMiddleware, async (req, res) => {
  try {
    let { status, priority, sortBy, search } = req.query;
    let filter = { userId: req.user._id };

    // 🔹 Apply Filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let tasksQuery = Task.find(filter);

    // 🔹 Sorting Logic
    if (sortBy) {
      if (sortBy === "priority") {
        // Custom sorting (high > medium > low)
        tasksQuery = tasksQuery.aggregate([
          {
            $addFields: {
              priorityOrder: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$priority", "high"] }, then: 1 },
                    { case: { $eq: ["$priority", "medium"] }, then: 2 },
                    { case: { $eq: ["$priority", "low"] }, then: 3 },
                  ],
                  default: 4,
                },
              },
            },
          },
          { $sort: { priorityOrder: 1 } },
        ]);
      } else if (sortBy === "createdAt") {
        tasksQuery = tasksQuery.sort({ createdAt: -1 });
      }
    } else {
      tasksQuery = tasksQuery.sort({ createdAt: -1 });
    }

    const tasks = await tasksQuery.exec();
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get tasks" });
  }
});

// 🔹 UPDATE Task
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// 🔹 DELETE Task
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
