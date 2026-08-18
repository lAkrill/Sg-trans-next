   module.exports = {
     apps: [
       {
         name: "next-app",
         script: "npm.cmd", // ВАЖНО: для Windows указываем именно npm.cmd
         args: "run start",
         interpreter: "cmd.exe",      // ← КЛЮЧЕВАЯ СТРОКА
        interpreter_args: "/c"      // ← Запуск через cmd /c
       }
     ]
   }