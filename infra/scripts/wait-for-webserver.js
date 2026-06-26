require("dotenv").config({
  path: ".env.development",
});

const origin = "http://localhost:3000";

async function waitForWebServer() {
  process.stdout.write("\n\n🟠 Aguardando Next.js aceitar conexões");

  while (true) {
    try {
      const response = await fetch(`${origin}/api/v1/status`);

      if (response.status === 200) {
        console.log("\n🟢 Next.js está pronto e aceitando conexões");
        return;
      }
    } catch {
      // Next.js ainda não está pronto.
    }

    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

waitForWebServer();
