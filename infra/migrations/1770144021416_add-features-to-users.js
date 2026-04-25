exports.up = (pgm) => {
  pgm.addColumns("users", {
    features: {
      type: "varchar[]",
      notNull: true,
      default: "{}",
    },
  });
};

exports.down = false;
