

let lst = [];
let sett = new Set();
sett.add(-1);
for(let i = 0; i < 100; i++) {
    rand = Math.floor(Math.random() * 1000);
    lst.push(rand);
    sett.add(rand);
}
console.log(lst);
console.log(sett);