module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "if exist node_modules rmdir /s /q node_modules"
      }
    },
    {
      method: "shell.run",
      params: {
        message: "if exist .next rmdir /s /q .next"
      }
    }
  ]
};
