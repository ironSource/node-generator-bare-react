<%- imports(
  { 'react': ['React'].concat(pureRender ? [] : [['Component']])
  , 'react-pure-render/component': pureRender && style !== 'es5' ? ['Component'] : false
  , 'react-pure-render/mixin': pureRender && style === 'es5' ? ['PureRender'] : false
  , 'react-bootstrap': bootstrap ? [false, ['Grid','Row','Col','Jumbotron','Button']] : false }) %>

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
    <% if (bootstrap) {%>return <Grid>
      <Row><Col xs={12}>
        <Jumbotron>
          <h1>{ this.props.title }</h1>
          <p>This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.</p>
          <p><Button bsStyle="primary">Learn more</Button></p>
        </Jumbotron>
      </Col></Row>
      <Row><Col xs={12}>{ this.props.children }</Col></Row>
    </Grid><%} else {%>return <div>
      <h1>{ this.props.title }</h1>
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

    <% if (bootstrap) {%>return <Grid>
      <Row><Col xs={12}>
        <Jumbotron>
          <h1>{ title }</h1>
          <p>This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.</p>
          <p><Button bsStyle="primary">Learn more</Button></p>
        </Jumbotron>
      </Col></Row>
      <Row><Col xs={12}>{ children }</Col></Row>
    </Grid><%} else {%>return <div>
      <h1>{ title }</h1>
      { children }
    </div><%}%>
  }
}

<% if (style==='es6') { %>export default <%= name %>;<% }
   else { %>module.exports = <%= name %> <% } %><%} %>
