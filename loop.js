// const loop = (callback, params) => {
//   let delay = 3_000;

//   const loopRecursiveFunction = () => {
//     const isCompleted = callback(params);
//     console.log("completed at", isCompleted);
//     if (isCompleted) {
//       delay = 10_000;
//     } else {
//       console.log("doubled");
//       delay *= 2;
//     }
//     timerId = setTimeout(loopRecursiveFunction, delay);
//   };

//   let timerId = setTimeout(loopRecursiveFunction, delay);
// };

// module.exports = loop;
