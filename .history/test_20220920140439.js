

lst = []
let rand = () => Math.random() * 1000
for(let i = 0; i < 100; i++) {
    lst.push(rand)
}

start = performance.now()