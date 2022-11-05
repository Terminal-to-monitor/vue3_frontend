
let permissions = localStorage.getItem('permissions')
let Authority = {
    deleteAuthority:permissions?.indexOf('delete'),
    updateAuthority:permissions?.indexOf('update'),
    addAuthority:permissions?.indexOf('add'),
}
console.log(Authority)
export default Authority
