// Maps keys in the json file to their properties in the resource types
export default {
  // json key: eli property (see Expression type for the available options)
  title: "title",
  data: "content",
  // NOTE (30/06/2026): We explicitly ignore the `committee` key to keep
  // things similar to the PDF flow.  Similarly we ignore the keys `date`,
  // `id`, and `decision`.
};
