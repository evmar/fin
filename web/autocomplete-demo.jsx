var AutoComplete = require('./autocomplete').AutoComplete;

var Demo = React.createClass({
  render() {
    var options = ["foo", "foox", "bar", "baz", "longlongword"];
    return (
      <main>
        <h1>AutoComplete demo</h1>
        <AutoComplete options={options} />
        </main>
    );
  },
});

React.render(
  React.createElement(Demo),
  document.body);
