import operator
import random


class Student:
    def __init__(self, student_id, cur_mod, choices):
        self.student_id = student_id
        self.cur_mod = cur_mod
        self.choices = choices

    def __str__(self):
        return self.student_id


class Module:
    def __init__(self, title, course_num, instructor, time, total_slots, description):
        self.title = title
        self.course_num = course_num
        self.instructor = instructor
        self.time = time
        self.total_slots = total_slots
        self.description = description

    def __str__(self):
        return f"{self.course_num}: {self.title}"

    def __hash__(self):
        return hash(str(self))


def main():
    modules = [Module('Environmental Humanities', '02.154HT', 'Sayan Bhattacharyya', 'Tues 3pm - 4.30pm', 30, 'nil'),
               Module('Cultures and Histories of the Digital', '02.150HT',
                      'Sayan Bhattacharyya', 'Thurs 3pm - 4.30pm', 30, 'nil'),
               Module('Being in the World: from Homer and Heidegger to A.I.',
                      '02.144DH', 'Paolo di Leo', 'Fri 1pm - 2.30pm', 30, 'nil'),
               Module('Satan and His Afterlives in Literature and Film',
                      '02.127DH', 'Rhema Hokama', 'Tues 3pm - 4.30pm', 30, 'nil'),
               Module('Introduction to Psychology', '02.218',
                      'Yow Wei Quin', 'Thurs 4pm - 6pm', 30, 'nil'),
               Module('Organizational Processes', '02.202', 'Grace Dixon', 'Mon 2.30pm - 4.30pm', 30, 'nil')]

    students = [Student('Amy', modules[0], {modules[1]: 80, modules[2]: 10, modules[3]: 10}),
                Student('Benny', modules[1], {
                        modules[2]: 60, modules[3]: 20, modules[4]: 20}),
                Student('Cara', modules[2], {
                        modules[3]: 65, modules[4]: 20, modules[0]: 15}),
                Student('David', modules[3], {modules[1]: 90, modules[2]: 5, modules[0]: 5})]

    '''
    Say you have mod A, query everyone who indicated A as one of their options and have mods that you want.
    First order everyone by *your* order of preference,
    then order people with the same mod by their weightage of mod A.
    Swap with top result.
    '''
    current = {}
    requested = {}
    swaps = []

    # initialise arrays
    for mod in modules:
        requested[mod.course_num] = []
        current[mod.course_num] = []

    # populate requested modules and current modules with students and weights
    for student in students:
        for mod in student.choices.keys():
            requested[mod.course_num].append((student, student.choices[mod]))
        current[student.cur_mod.course_num].append(student)

    # sort requested mods based on weightage
    for mod in requested.keys():
        requested[mod].sort(key=lambda tup: tup[1], reverse=True)

    print("\nSTARTING TRADING ALGORITHM")
    print("=====\n")
    # randomly decide order in which students get to trade
    random.shuffle(students)
    print("SHUFFLING STUDENTS")
    print("=====\n")
    print(f"Students Queue: {[str(s) for s in students]}")
    print("=====\n")

    # print("requested: ", end='')
    # print({m: [str(st[0]) for st in s] for m, s in requested.items()})
    # print('current: ', end='')
    # print({m: [str(st) for st in s] for m, s in current.items()})

    temp_students = students[:]
    # trade
    for student in temp_students:
        # DEMO PURPOSES
        print(f"CURRENT STUDENT: {student}")
        # DEMO PURPOSES
        print("=====")
        # print(f"swapping for {str(student)} now, students who requested this dude's mods are: {[str(s[0]) for s in requested[student.cur_mod.course_num]]}")
        if student not in students:
            print(f"{student} has already traded.\n")
            continue
        # sort student's choices based on weightage
        choices = {k: v for k, v in sorted(
            student.choices.items(), key=lambda item: item[1], reverse=True)}

        # DEMO PURPOSES
        string_choices = {k.course_num: v for k,
                          v in choices.items()}
        # DEMO PURPOSES
        print(f"{student}'s choices': {string_choices}")

        possible_swaps = []
        for mod in choices.keys():
            # loop through current dude's desired mods
            for s in current[mod.course_num]:
                # loop through all students in mods that this dude wants
                if s not in students:
                    # remove student from list if student is no longer available for trade
                    # print(
                    # f'Oops {s.student_id} has already traded. remove the dude')
                    current[mod.course_num].remove(s)
                else:
                    their_choices = [m for m in s.choices.keys()]
                    if student.cur_mod in their_choices:
                        # check if these students in mods that this dude wants want this dude's mod
                        # add to list of possible swaps if they want it
                        # print(f'{s.student_id} could trade!')
                        possible_swaps.append((s, s.choices[student.cur_mod]))

        while len(possible_swaps) > 0 and possible_swaps[0][0] not in students:
            # if student that this guy would have swapped with has already been assigned a swap, remove that student
            possible_swaps = possible_swaps[1:]

        string_possible_swaps = [(a.student_id, b)
                                 for (a, b) in possible_swaps]
        print(f"Students who can trade: {string_possible_swaps}\n")

        if len(possible_swaps) > 0:
            # carry out swap
            swaps.append((str(student), str(possible_swaps[0][0])))
            students.remove(student)
            students.remove(possible_swaps[0][0])
            print(
                f"Trade between {student} and {possible_swaps[0][0]} completed\n")

    print(f"swaps: {swaps}")


if __name__ == '__main__':
    main()
