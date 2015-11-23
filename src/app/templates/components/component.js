<%- imports(
  { 'react': ['React'].concat(pureRender ? [] : [['Component']])
  , 'react-pure-render/component': pureRender && style !== 'es5' ? ['Component'] : false
  , 'react-pure-render/mixin': pureRender && style === 'es5' ? ['PureRender'] : false
  , 'react-bootstrap': bootstrap ? [false, ['Panel']] : false }) %>

<% if (style === 'es6') { %>const { string } = React.PropTypes<% }
   else if (style === 'es6-functional') { %>const { string } = React.PropTypes<% }
   else { %>var string = React.PropTypes.string <% } %>

<% if (style === 'es5') { %>module.exports = React.createClass({
  <% if (pureRender) { %>mixins: [PureRender],
  <% } %>displayName: '<%= name %>',

  propTypes: {
    title: string
  },

  getDefaultProps: function() {
    return { title: 'I am <%= name %>' }
  },

  render: function() {
    <% if (bootstrap) {%>return <Panel header={this.props.title}>
      <p>Panel content</p>
      { this.props.children }
    </Panel><%} else {%>return <div>
      <h2>{ title }</h2>
      <p>Panel content</p>
      { this.props.children }
    </div><%}%>
  }
})<%} else { %>class <%= name %> extends Component {
  static defaultProps = { title: 'I am <%= name %>' }
  static propTypes = {
    title: string
  }

  render() {
    let { children, title } = this.props

    <% if (bootstrap) {%>return <Panel header={title}>
      <p>Panel content</p>
      { children }
    </Panel><%} else {%>return <div>
      <h2>{ title }</h2>
      <p>Panel content</p>
      { children }
    </div><%}%>
  }
}

<% if (style==='es6') { %>export default <%= name %>;<% }
   else { %>module.exports = <%= name %> <% } %><%} %>
