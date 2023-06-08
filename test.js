// // const date = new Date(1686199317 * 1000);
// const date = new Date();

// const date_beginTime = new Date(
//   new Date(`${new Date().toISOString().split("T")[0]}T00:00:00Z`).getTime() +
//     3600 * 24 * 1000
// );

// const date_string = date.toISOString().split("T")[0].split("-").join("");

// console.log(date_string);
const last_day_of_month = (props /* [2023, 05, 08] */) => {
  const date_ = new Date(...props, 00, 00, 00)
    .toISOString()
    .split("T")[0]
    .split("-");
  return new Date(date_[0], date_[1] - 1, 00);
};

const first_day_of_month = (props /* [2023, 05, 08] */) => {
  const date_ = new Date(...props, 00, 00, 00)
    .toISOString()
    .split("T")[0]
    .split("-");
  return new Date(date_[0], date_[1] - 2, 01);
};

// console.log(last_day_of_month([2023, 1, 08]).toISOString());

console.log([1, 2].slice(1));
