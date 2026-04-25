function getOrigin() {
  if (["test", "development"].includes(process.env.NODE_ENV)) {
    return "http://localhost:3000";
  }

  if (process.env.VERCEL_URL === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://tabgeo.com.br";
}

const webserver = {
  origin: getOrigin(),
};

export default webserver;
