<% if (router) {%><%- imports(
  { 'react': ['React']
  , 'react-dom': ['ReactDOM']
  , './components/$paramName': [name]
  , 'react-router': [false, ['Router', 'Route']] }) %>

<% if (append){%>let mountNode = document.createElement('div')
document.body.appendChild(mountNode)
<%} else {%>let mountNode = document.body
<%}%>
ReactDOM.render((
  <Router>
    <Route path="/" component={<%= name %>}>
      
    </Route>
  </Router>
), mountNode)<%} else {%><%- imports(
  { 'react': ['React']
  , 'react-dom': ['ReactDOM']
  , './components/$paramName': [name] }) %>

<% if (append){%>let mountNode = document.createElement('div')
document.body.appendChild(mountNode)
<%} else {%>let mountNode = document.body
<%}%>
ReactDOM.render(<<%= name %> />, mountNode)<%}%>
