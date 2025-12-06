function status(request, response) {
  response.status(200).json({ message: "são pessoas acima da média!" });
}

export default status;
