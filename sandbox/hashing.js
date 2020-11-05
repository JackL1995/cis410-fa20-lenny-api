const bcrypt = require('bcryptjs')

var hashedPswd = bcrypt.hashSync('asdfasdf')

console.log(hashedPswd)

var hashTest = bcrypt.compareSync('asdfasdf', hashedPswd)
console.log(hashTest)