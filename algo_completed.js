class Student{
    constructor(student_id,cur_mod,choices){
        this.student_id=student_id;
        this.cur_mod=cur_mod;
        this.choices=choices;
    }
    toString(){
        return self.student_id
    }
}

class Module{
    constructor(self, title, course_num, instructor, time, total_slots, description){
        self.title = title
        self.course_num = course_num
        self.instructor = instructor
        self.time = time
        self.total_slots = total_slots
        self.description = description
    }
        
    toString(){
        return (self.course_num+": "+self.title)
    }  

}

class Dictionary {
    constructor() {
        this.items = {};
    }
    has(key) {
        return key in this.items;
    }
    set(key, value) {
        this.items[key] = value;
    }
    remove(key) {
        if (this.has(key)) {
            delete this.items[key];
            return true;
        }
        return false;
    }
    get(key) {
        return this.has(key) ? this.items[key] : undefined;
    }
    keys() {
        var keys = [];
        for (var k in this.items) {
            if (this.items.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    }
    values() {
        var values = [];
        for (var k in this.items) {
            if (this.items.hasOwnProperty(k)) {
                values.push(this.items[k]);
            }
        }
        return values;
    }
    getItems() {
        return this.items;
    }
    clear() {
        this.items = {};
    }
    size() {
        var count = 0;
        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                ++count;
            }
        }
        return count;
    }
}
     
     
function main(){
    var modules=[new Module('A', '02.001', 'Sayan', 'Tues 3pm - 4.30pm', 30, 'Blah blah blah'), 
    new Module('B', '02.002', 'Sayan', 'Thurs 3pm - 4.30pm', 30, 'Blah blah blah'),
    new Module('C', '02.003', 'Paolo', 'Fri 1pm - 2.30pm', 30, 'Blah blah blah'),
    new Module('D', '02.004', 'Rhema', 'Tues 3pm - 4.30pm', 30, 'Blah blah blah'),
    new Module('E', '02.005', 'Pang', 'Thurs 4pm - 6pm', 30, 'Blah blah blah'),
    new Module('F', '02.006', 'Nilanjan', 'Mon 2.30pm - 4.30pm', 30, 'Blah blah blah')]

    var dictionary1 = new Dictionary();
    dictionary1.set(modules[1],80);
    dictionary1.set(modules[2],10);
    dictionary1.set(modules[3],10);

    var dictionary2 = new Dictionary();
    dictionary2.set(modules[2],60);
    dictionary2.set(modules[3],20);
    dictionary2.set(modules[4],20);

    var dictionary3 = new Dictionary();
    dictionary3.set(modules[3],65);
    dictionary3.set(modules[4],20);
    dictionary3.set(modules[0],15);

    var dictionary4 = new Dictionary();
    dictionary4.set(modules[1],90);
    dictionary4.set(modules[2],5);
    dictionary4.set(modules[0],5);

    var students=[new Student('1001001', modules[0], dictionary1),
    new Student('1001002', modules[1], dictionary2),
    new Student('1001003', modules[2], dictionary3),
    new Student('1001004', modules[3], dictionary4)]

    var current = new Dictionary();
    var requested = new Dictionary();
    var swaps = [];

    //initialise arrays
    for (mod in modules){
        requested[mod.course_num] = [];
        current[mod.course_num] = [];
    }

    // populate requested modules and current modules with students and weights
    for (student in students){
        for (mod in student.choices.keys()){
            requested[students.j.course_num].append((student, student.choices[mod]));
        }
        current[student.cur_mod.course_num].append(student);
    }

    // sort requested mods based on weightage
    for (mod in requested.keys()){
        requested[mod].sort();
    }

    // randomly decide order in which students get to trade
    students.sort(Math.random);
    console.log("students: ");
    for (str in students){
        console.log(str);
    }
    console.log("requested: ");
    for (s in requested.items){
        for (st in s){
            console.log(st[0]);
        }
    }
    console.log("current: ");
    for (s in current.items){
        for (st in s){
            console.log(st[0]);
        }
    }
    var temp_students=[];
    for(var i=0; i<arr.length; i++){ 
        temp_students[i]=students[i];
    }

    // trade
    for (student in temp_students){
        console.log("swapping for "+student+" now, students who requested this dude's mods are: ");
        for (s in requested[student.cur_mod.course_num]){
            console.log(str(s[0]));
        }
        if (students.includes(student)==false){
            continue;
        }
        // sort student's choices based on weightage
        //can not understant this line
        //choices = {k: v for k, v in sorted(student.choices.items(), key=lambda item: item[1], reverse=True)}
        choices=student.choices.items().sort(compare(student.choices.values()));
        possible_swaps = []
        for (mod in choices.keys()){
            // loop through current dude's desired mods
            for (s in current[mod.course_num]){
                // loop through all students in mods that this dude wants
                if (students.includes(s)==false){
                    // remove student from list if student is no longer available for trade
                    console.log("Oops "+s.student_id+" has already traded. remove the dude");
                    current[mod.course_num].remove(s);
                }
                else{
                    var their_choices=[];
                    for (m in s.choices.keys()){
                        their_choices.append(m);
                    }
                    if (student.cur_mod in their_choices){
                        // check if these students in mods that this dude wants want this dude's mod
                        // add to list of possible swaps if they want it
                        console.log(s.student_id+" could trade!");
                        possible_swaps.append((s, s.choices[student.cur_mod]));
                    }
                }
            }
        }
            
        while (possible_swaps.length > 0 && students.includes(possible_swaps[0][0])==false){
            // if student that this guy would have swapped with has already been assigned a swap, remove that student
            possible_swaps.shift();
        }
            
        if (possible_swaps.length > 0){
            // carry out swap 
            swaps.append((str(student), str(possible_swaps[0][0])));
            students.remove(student);
            students.remove(possible_swaps[0][0]);
        }
    }
        
    console.log("swaps: "+swaps);
}