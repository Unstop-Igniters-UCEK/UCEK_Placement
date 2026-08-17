import {
  User,
  MockTest,
  InterviewQuestion,
  SeniorMentor,
  MentorshipPair,
  ResumeData,
  TestResult
} from '../types';

export { INITIAL_ROADMAPS } from './roadmaps';

export const DEMO_USERS: User[] = [
  {
    id: 'usr_mentee_1',
    name: 'Anand Nair',
    email: 'anand.nair@ucek.ac.in',
    role: 'mentee',
    year: '4th Year',
    branch: 'CSE',
    domain: 'Software Engineering',
    readinessScore: 78,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'usr_admin_1',
    name: 'Dr. Suresh Kumar',
    email: 'placement.cell@ucek.ac.in',
    role: 'admin',
    year: 'Faculty',
    branch: 'Placement Cell',
    domain: 'Management & Consulting',
    readinessScore: 100,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
  }
];

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'tcs_ninja_drive',
    title: 'TCS Ninja & Digital National Drive Mock 2026',
    category: 'Company Drive',
    companyTag: 'TCS',
    durationMinutes: 40,
    questionCount: 18,
    passPercentage: 70,
    description: 'Comprehensive simulation matching TCS NQT question style covering Numerical Ability, Verbal Reasoning, & Core Coding Concepts.',
    questions: [
      {
        id: 'q1',
        title: 'A train 150m long passes a telegraph post in 12 seconds. What is the speed of the train in km/hr?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['45 km/hr', '50 km/hr', '36 km/hr', '40 km/hr'],
        correctOption: 0,
        explanation: 'Speed = Distance / Time = 150m / 12s = 12.5 m/s. Converting to km/hr: 12.5 * (18 / 5) = 45 km/hr.'
      },
      {
        id: 'q2',
        title: 'Which data structure is primarily used to implement Recursion in programming languages?',
        type: 'Technical',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['Queue', 'Call Stack', 'Min-Heap', 'Graph'],
        correctOption: 1,
        explanation: 'Recursion uses the system Call Stack to manage active function frames and local scope.'
      },
      {
        id: 'q3',
        title: 'Select the antonym for the word "BENEVOLENT":',
        type: 'Verbal',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['Malevolent', 'Generous', 'Altruistic', 'Friendly'],
        correctOption: 0,
        explanation: 'Benevolent means well-meaning and kindly. Malevolent means wishing to do evil to others.'
      },
      {
        id: 'q4',
        title: 'What is the output of `typeof null` in JavaScript?',
        type: 'Technical',
        companyTag: 'TCS',
        difficulty: 'Medium',
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        correctOption: 2,
        explanation: 'Due to a historical bug in early JavaScript, `typeof null` evaluates to `"object"`.'
      },
      {
        id: 'q5',
        title: 'If 6 men and 8 boys can do a piece of work in 10 days, while 26 men and 48 boys can do it in 2 days, what is the ratio of work done by 1 man to 1 boy?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Hard',
        options: ['2 : 1', '3 : 1', '1 : 2', '4 : 1'],
        correctOption: 0,
        explanation: 'Equating work: 10(6M + 8B) = 2(26M + 48B) => 60M + 80B = 52M + 96B => 8M = 16B => M/B = 2/1.'
      },
      {
        id: 'q6',
        title: 'If a clock takes 7 seconds to strike 7, how long will the same clock take to strike 10?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Medium',
        options: ['10.5 seconds', '10 seconds', '9.5 seconds', '11 seconds'],
        correctOption: 0,
        explanation: 'The clock strikes for the first time at start, leaving 6 intervals in 7s => 1 interval = 7/6s. For 10 strikes, 9 intervals take 9 * (7/6) = 10.5 seconds.'
      },
      {
        id: 'q7',
        title: 'Two trains start from stations A and B spaced 50 km apart at the same time towards each other at 50 km/h. A bird flies continuously back and forth between them at 100 km/h. How far did the bird fly before collision?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Hard',
        options: ['100 km', '50 km', '75 km', '120 km'],
        correctOption: 0,
        explanation: 'Relative speed of trains = 100 km/h. Collision time = 50km / 100km/h = 0.5h. Bird distance = 100 km/h * 1h total travel = 100 km.'
      },
      {
        id: 'q8',
        title: 'Complete the mathematical number series: 5, 20, 24, 6, 2, 8, ?',
        type: 'Logical',
        companyTag: 'TCS',
        difficulty: 'Medium',
        options: ['12', '16', '10', '14'],
        correctOption: 0,
        explanation: 'Operations pattern using 4: 5*4=20, 20+4=24, 24/4=6, 6-4=2, 2*4=8, 8+4=12.'
      },
      {
        id: 'q9',
        title: 'A person travels to a city at 10 mph and returns back along the same route at 15 mph. What is their average speed for the round trip?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Medium',
        options: ['12 mph', '12.5 mph', '11.5 mph', '13 mph'],
        correctOption: 0,
        explanation: 'Harmonic mean speed formula = 2 * v1 * v2 / (v1 + v2) = 2 * 10 * 15 / (10 + 15) = 300 / 25 = 12 mph.'
      },
      {
        id: 'q10',
        title: 'A person was 80 years old in the year 490 BC and only 70 years old in the year 500 BC. In which year was he born?',
        type: 'Logical',
        companyTag: 'TCS',
        difficulty: 'Medium',
        options: ['570 BC', '470 BC', '510 BC', '430 BC'],
        correctOption: 0,
        explanation: 'In BC years count backwards. Born in 570 BC => In 500 BC age is (570-500) = 70, in 490 BC age is (570-490) = 80.'
      },
      {
        id: 'q11',
        title: 'Fresh fruit contains 72% water while dry fruit contains 20% water. How much dry fruit can be obtained from 100 grams of fresh fruit?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Hard',
        options: ['35 grams', '30 grams', '40 grams', '28 grams'],
        correctOption: 0,
        explanation: 'Fruit solid content in 100g fresh fruit = 28g. Dry fruit has 80% solid content => Dry fruit weight = 28 / 0.80 = 35 grams.'
      },
      {
        id: 'q12',
        title: 'How many two-digit numbers have their square ending with the digit 8?',
        type: 'Logical',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['0', '2', '4', '8'],
        correctOption: 0,
        explanation: 'No perfect square in mathematics can end in 2, 3, 7, or 8. Therefore, exactly 0 two-digit numbers end in 8.'
      },
      {
        id: 'q13',
        title: 'In how many years will $1,200 amount to $1,323 at 5% per annum compound interest?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Medium',
        options: ['2 years', '3 years', '1.5 years', '4 years'],
        correctOption: 0,
        explanation: '1323 / 1200 = 441 / 400 = (21/20)^2. Since 1 + 5/100 = 21/20, time n = 2 years.'
      },
      {
        id: 'q14',
        title: 'The sum of three consecutive integers is 132. Find the square of the largest number among them.',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['2025', '1936', '1849', '2116'],
        correctOption: 0,
        explanation: 'Let numbers be x-1, x, x+1 => 3x = 132 => x = 44. Largest number = 45. 45^2 = 2025.'
      },
      {
        id: 'q15',
        title: 'Father\'s present age is 5 times his son\'s age. 4 years ago, father was 9 times as old as his son. What are their present ages?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Medium',
        options: ['Father 40, Son 8', 'Father 35, Son 7', 'Father 45, Son 9', 'Father 50, Son 10'],
        correctOption: 0,
        explanation: 'F = 5S. F - 4 = 9(S - 4) => 5S - 4 = 9S - 36 => 4S = 32 => S = 8, F = 40.'
      },
      {
        id: 'q16',
        title: 'Which printf statement correctly outputs the literal `%` character in C?',
        type: 'Technical',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['printf("%%");', 'printf("\\%");', 'printf("\\\\%");', 'printf("\\%%");'],
        correctOption: 0,
        explanation: 'In C printf formatting, `%%` is the standard escape sequence to print a literal `%` character.'
      },
      {
        id: 'q17',
        title: 'Which sorting algorithms guarantee both Best-Case and Worst-Case time complexities of O(N log N)?',
        type: 'Technical',
        companyTag: 'TCS',
        difficulty: 'Medium',
        options: ['Merge Sort & Heap Sort', 'Quick Sort & Bubble Sort', 'Insertion Sort & Selection Sort', 'Radix Sort & Counting Sort'],
        correctOption: 0,
        explanation: 'Merge Sort and Heap Sort maintain O(N log N) execution time across all input conditions.'
      },
      {
        id: 'q18',
        title: 'In CPU Round Robin scheduling, if the time quantum is configured to be arbitrarily large, it degenerates into:',
        type: 'Technical',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['First-Come First-Served (FCFS)', 'Shortest Job First (SJF)', 'Priority Scheduling', 'Multilevel Queue'],
        correctOption: 0,
        explanation: 'When time quantum exceeds max process burst time, processes execute to completion without preemption, matching FCFS.'
      }
    ]
  },
  {
    id: 'infosys_nqt',
    title: 'Infosys Specialist Programmer Diagnostic Exam',
    category: 'Company Drive',
    companyTag: 'Infosys',
    durationMinutes: 35,
    questionCount: 16,
    passPercentage: 75,
    description: 'Standard Infosys NQT pattern test focusing on Logical Deductions, Data Interpretation, C/C++ Concepts, and Algorithm optimization.',
    questions: [
      {
        id: 'iq1',
        title: 'Find the next number in the logical series: 3, 5, 9, 17, 33, ?',
        type: 'Logical',
        companyTag: 'Infosys',
        difficulty: 'Easy',
        options: ['65', '49', '64', '55'],
        correctOption: 0,
        explanation: 'The difference between terms doubles each step (+2, +4, +8, +16, +32). 33 + 32 = 65.'
      },
      {
        id: 'iq2',
        title: 'In Time Complexity analysis, what does Big-Omega (Ω) notation denote?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: ['Upper Bound', 'Lower Bound / Best Case', 'Tight Bound', 'Average Case'],
        correctOption: 1,
        explanation: 'Big-Omega (Ω) represents asymptotic lower bound (best-case lower limit) of execution time.'
      },
      {
        id: 'iq3',
        title: 'Which SQL keyword is used to eliminate duplicate rows from a SELECT query result?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Easy',
        options: ['UNIQUE', 'DISTINCT', 'GROUP BY', 'DIFFERENT'],
        correctOption: 1,
        explanation: 'SELECT DISTINCT column_name FROM table_name returns unique distinct records.'
      },
      {
        id: 'iq4',
        title: 'Choose the grammatically correct sentence:',
        type: 'Verbal',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: [
          'Neither the manager nor the employees was present.',
          'Neither the manager nor the employees were present.',
          'Neither the manager nor the employees are present yesterday.',
          'Neither manager nor employees were present.'
        ],
        correctOption: 1,
        explanation: 'In "neither... nor" structures, the verb agrees with the subject closest to it ("employees were").'
      },
      {
        id: 'iq5',
        title: 'Fifty minutes ago if it was four times as many minutes past 3 o\'clock, how many minutes is it to 6 o\'clock?',
        type: 'Logical',
        companyTag: 'Infosys',
        difficulty: 'Hard',
        options: ['26 minutes', '20 minutes', '34 minutes', '15 minutes'],
        correctOption: 0,
        explanation: 'Let x be mins past 3:00 50 mins ago. Time now = 3:00 + x + 50. Total mins 3:00 to 6:00 is 180. Solving equations yields 26 minutes remaining to 6:00.'
      },
      {
        id: 'iq6',
        title: 'Two church towers are 150 ft and 200 ft high. A grain is placed between them such that two birds flying at equal speed from tower tops reach it simultaneously. Distance of grain from 150 ft tower (if towers are 250 ft apart):',
        type: 'Aptitude',
        companyTag: 'Infosys',
        difficulty: 'Hard',
        options: ['90 ft', '100 ft', '120 ft', '80 ft'],
        correctOption: 0,
        explanation: 'Equating hypotenuses squared: 150^2 + x^2 = 200^2 + (250-x)^2 => 22500 + x^2 = 40000 + 62500 - 500x + x^2 => 500x = 80000 => x = 90 ft.'
      },
      {
        id: 'iq7',
        title: '100 light bulbs numbered 1 to 100 are initially OFF. 100 people toggle multiples of their position. How many bulbs remain ON at the end?',
        type: 'Logical',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: ['10 bulbs', '50 bulbs', '25 bulbs', '1 bulb'],
        correctOption: 0,
        explanation: 'Only perfect square numbers (1, 4, 9, 16, 25, 36, 49, 64, 81, 100) have an odd number of total factors. Thus, 10 bulbs remain ON.'
      },
      {
        id: 'iq8',
        title: 'Raju distributes Rs 1000 among his 5 children such that their shares are in Arithmetic Progression. What is the share of the youngest child?',
        type: 'Aptitude',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: ['Rs 160', 'Rs 200', 'Rs 150', 'Rs 180'],
        correctOption: 0,
        explanation: 'Let shares be a-2d, a-d, a, a+d, a+2d. Sum = 5a = 1000 => a = 200. With standard non-negative d progression, youngest share = Rs 160.'
      },
      {
        id: 'iq9',
        title: 'What is the decimal equivalent value of (121) base 4 + (84) base 16?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: ['159', '160', '132', '175'],
        correctOption: 0,
        explanation: '(121)_4 = 1*16 + 2*4 + 1 = 25. (84)_16 = 8*16 + 4 = 132. Total = 25 + 132 = 159 in decimal.'
      },
      {
        id: 'iq10',
        title: 'Which page replacement algorithm achieves the theoretical minimum number of page faults?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: ['Optimal Page Replacement (OPT)', 'First In First Out (FIFO)', 'Least Recently Used (LRU)', 'Least Frequently Used (LFU)'],
        correctOption: 0,
        explanation: 'Belady\'s Optimal Page Replacement algorithm replaces the page that will not be used for the longest time in future.'
      },
      {
        id: 'iq11',
        title: 'In the OSI 7-layer networking architecture, at which layer is packet Routing performed?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Easy',
        options: ['Network Layer (Layer 3)', 'Data Link Layer (Layer 2)', 'Transport Layer (Layer 4)', 'Session Layer (Layer 5)'],
        correctOption: 0,
        explanation: 'Packet routing across logical network boundaries is performed at Layer 3 (Network Layer).'
      },
      {
        id: 'iq12',
        title: 'Which networking protocol resolves a known IP address to its corresponding physical hardware MAC address?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Easy',
        options: ['ARP (Address Resolution Protocol)', 'RARP', 'DHCP', 'ICMP'],
        correctOption: 0,
        explanation: 'ARP (Address Resolution Protocol) translates IP addresses to hardware MAC addresses.'
      },
      {
        id: 'iq13',
        title: 'When a C function is invoked, where is the return address of the caller stored?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Easy',
        options: ['System Call Stack', 'Heap Memory', 'Data Segment', 'CPU Registers'],
        correctOption: 0,
        explanation: 'Function return addresses, parameters, and stack frames are stored on the system Call Stack.'
      },
      {
        id: 'iq14',
        title: 'What is the output of macro `#define perplexed 3` after `#undef perplexed` and `#define perplexed 4`?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: ['4', '3', '2', '0'],
        correctOption: 0,
        explanation: 'The macro `perplexed` is redefined to 4 inside the preprocessor directive block.'
      },
      {
        id: 'iq15',
        title: 'What happens when executing `char *p = "hello world"; p[0] = \'H\'; printf("%s", p);` in C?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Hard',
        options: ['Segmentation Fault / Runtime Error (Modifying string literal)', 'Outputs "Hello world"', 'Compilation Error', 'Outputs "hello world"'],
        correctOption: 0,
        explanation: 'String literals are stored in read-only memory. Attempting to mutate p[0] causes a runtime segmentation fault.'
      },
      {
        id: 'iq16',
        title: 'Which data structure is optimal for dictionary search operations requiring fast prefix spell checking?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: ['Trie / Hash Table', 'Binary Search Tree', 'Linked List', 'Stack'],
        correctOption: 0,
        explanation: 'Tries (Prefix Trees) provide O(K) lookup time where K is word length, making them ideal for spell check and autocomplete.'
      }
    ]
  },
  {
    id: 'technical_core_cpp',
    title: 'Core C/C++ Systems & CS Fundamentals Test',
    category: 'Technical',
    companyTag: 'Core Systems',
    durationMinutes: 30,
    questionCount: 15,
    passPercentage: 70,
    description: 'High-frequency placement technical questions on C pointers, Unions, Memory layout, OOP C++, Operating Systems & Computer Networks.',
    questions: [
      {
        id: 'tc1',
        title: 'What is the output of `union u { struct { int i:4; int j:4; int k:4; int l; } st; int i; } u; u.i = 100; printf("%d, %d, %d", u.i, u.st.i, u.st.l);`?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Hard',
        options: ['100, 4, 0', '4, 4, 0', '0, 0, 0', '40, 4, 0'],
        correctOption: 0,
        explanation: 'u.i sets value 100 (binary 01100100). u.st.i accesses the lower 4 bits (0100 = 4 decimal). u.st.l is offset 0.'
      },
      {
        id: 'tc2',
        title: 'What is the value of `sizeof(u)` and `sizeof(u.a)` for `union u { union u1 { int i; int j; } a[10]; int b[10]; } u;` on 32-bit systems?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Medium',
        options: ['40 bytes, 40 bytes', '4 bytes, 4 bytes', '400 bytes, 40 bytes', '20 bytes, 200 bytes'],
        correctOption: 0,
        explanation: 'An array of 10 integers (4 bytes each) takes 40 bytes. Since u is a union of a[10] and b[10], sizeof(u) = 40 and sizeof(u.a) = 40.'
      },
      {
        id: 'tc3',
        title: 'What happens when executing `int i = 25, *p = &i; printf("%f", i/(*p));` in C?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Medium',
        options: ['Format Mismatch / Abnormal Output (int printed via %f)', 'Prints 1.000000', 'Prints 0.000000', 'Runtime Crash'],
        correctOption: 0,
        explanation: 'i/(*p) yields integer 1, but passing an int to %f causes printf format specifier mismatch.'
      },
      {
        id: 'tc4',
        title: 'How do you correctly print a literal `%` symbol using `printf` in C?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Easy',
        options: ['printf("%%");', 'printf("\\%");', 'printf("\\\\%");', 'printf("\\%%");'],
        correctOption: 0,
        explanation: 'In C printf format strings, double percent `%%` escapes the format character to output `%`.'
      },
      {
        id: 'tc5',
        title: 'What is the evaluation result of `#define perplexed 3` after preprocessor `#undef perplexed` and `#define perplexed 4`?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Medium',
        options: ['4', '3', '2', '0'],
        correctOption: 0,
        explanation: 'The macro `perplexed` is undef’d and redefined to 4, replacing all subsequent usages with 4.'
      },
      {
        id: 'tc6',
        title: 'Which pair of sorting algorithms guarantees O(N log N) time complexity in both Best and Worst cases?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Easy',
        options: ['Merge Sort & Heap Sort', 'Quick Sort & Bubble Sort', 'Insertion Sort & Selection Sort', 'Radix Sort & Counting Sort'],
        correctOption: 0,
        explanation: 'Merge Sort and Heap Sort consistently achieve O(N log N) time performance across all input cases.'
      },
      {
        id: 'tc7',
        title: 'What is the primary function of declaring a base class as `virtual` in C++ object-oriented inheritance?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Medium',
        options: [
          'To prevent duplicate base subobjects in diamond inheritance',
          'To restrict private members from child access',
          'To force all derived classes to be static',
          'To disable dynamic dispatch'
        ],
        correctOption: 0,
        explanation: 'Virtual base classes prevent duplicate copies of a common ancestor in multiple/diamond inheritance.'
      },
      {
        id: 'tc8',
        title: 'Which Page Replacement algorithm yields the minimum possible number of page faults?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Easy',
        options: ['Optimal Page Replacement (OPT)', 'First In First Out (FIFO)', 'Least Recently Used (LRU)', 'Least Frequently Used (LFU)'],
        correctOption: 0,
        explanation: 'Belady\'s Optimal Page Replacement replaces the page that will not be used for the longest time in future.'
      },
      {
        id: 'tc9',
        title: 'In C language assignment statements (`x = y`), what does the assignment operator target on its left side?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Easy',
        options: ['l-value (modifiable memory location)', 'r-value', 'constant literal', 'void pointer'],
        correctOption: 0,
        explanation: 'The assignment operator requires an l-value (locator value), representing a modifiable memory location.'
      },
      {
        id: 'tc10',
        title: 'In OS CPU scheduling, if the Time Quantum in Round Robin algorithm is set extremely large, it degenerates into:',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Easy',
        options: ['First-Come First-Served (FCFS)', 'Shortest Job First (SJF)', 'Priority Scheduling', 'Multilevel Queue'],
        correctOption: 0,
        explanation: 'Without preemption forced by a small quantum, processes run to completion in arrival order (FCFS).'
      },
      {
        id: 'tc11',
        title: 'In the OSI 7-layer networking architecture, at which layer is packet Routing performed?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Easy',
        options: ['Network Layer (Layer 3)', 'Data Link Layer (Layer 2)', 'Transport Layer (Layer 4)', 'Session Layer (Layer 5)'],
        correctOption: 0,
        explanation: 'Routing across logical IP networks is performed at Layer 3 (Network Layer).'
      },
      {
        id: 'tc12',
        title: 'Which network protocol maps a given IP address to its corresponding physical MAC address?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Easy',
        options: ['ARP (Address Resolution Protocol)', 'RARP', 'DHCP', 'ICMP'],
        correctOption: 0,
        explanation: 'ARP (Address Resolution Protocol) resolves IPv4 addresses to physical MAC hardware addresses.'
      },
      {
        id: 'tc13',
        title: 'When a function call takes place in C/C++, where is the caller function\'s return address stored?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Easy',
        options: ['System Call Stack', 'Heap Memory', 'Data Segment', 'BSS Segment'],
        correctOption: 0,
        explanation: 'Stack frames store function parameters, local variables, and return addresses on the Call Stack.'
      },
      {
        id: 'tc14',
        title: 'What is the total decimal value of `(121) base 4 + (84) base 16`?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Medium',
        options: ['159', '160', '132', '175'],
        correctOption: 0,
        explanation: '(121)_4 = 1*16 + 2*4 + 1 = 25. (84)_16 = 8*16 + 4 = 132. 25 + 132 = 159 decimal.'
      },
      {
        id: 'tc15',
        title: 'Which data structure is best suited for dictionary search operations with spell checking capabilities?',
        type: 'Technical',
        companyTag: 'Core Systems',
        difficulty: 'Medium',
        options: ['Trie / Hash Table', 'Binary Search Tree', 'Linked List', 'Stack'],
        correctOption: 0,
        explanation: 'Tries store string prefixes efficiently, enabling fast O(K) dictionary lookups and spell check suggestions.'
      }
    ]
  },
  {
    id: 'general_aptitude',
    title: 'Universal Quantitative & Logical Aptitude Test',
    category: 'Aptitude',
    companyTag: 'Aptitude & Reasoning',
    durationMinutes: 35,
    questionCount: 20,
    passPercentage: 65,
    description: 'High-frequency campus placement questions on Probability, Permutations, Clocks, Speed-Distance, Number Series & Syllogisms.',
    questions: [
      {
        id: 'ga1',
        title: 'Two dice are tossed together. What is the probability that the sum of numbers obtained is a prime number?',
        type: 'Aptitude',
        difficulty: 'Medium',
        options: ['15/36 (5/12)', '7/36', '1/2', '13/36'],
        correctOption: 0,
        explanation: 'Total outcomes = 36. Prime sums possible: 2, 3, 5, 7, 11. Count of outcomes = 1 + 2 + 4 + 6 + 2 = 15. Probability = 15/36 = 5/12.'
      },
      {
        id: 'ga2',
        title: 'All cats are animals. All animals are living beings. Conclusion: All cats are living beings.',
        type: 'Logical',
        difficulty: 'Easy',
        options: ['Valid', 'Invalid', 'Partially True', 'Cannot be Determined'],
        correctOption: 0,
        explanation: 'Standard transitive syllogism: Cats ⊂ Animals ⊂ Living Beings => Cats ⊂ Living Beings.'
      },
      {
        id: 'ga3',
        title: 'If LOGIC is coded as MTHJD, how is SMART coded in the same pattern?',
        type: 'Logical',
        difficulty: 'Medium',
        options: ['TNBUS', 'TLBSU', 'TNBSU', 'TMCUS'],
        correctOption: 2,
        explanation: 'Each letter is shifted by +1 (L->M, O->P... S->T, M->N, A->B, R->S, T->U = TNBSU).'
      },
      {
        id: 'ga4',
        title: 'A merchant had to weigh amounts from 1 kg to 121 kgs to the nearest kg. What is the minimum number of weights required and their values?',
        type: 'Aptitude',
        difficulty: 'Hard',
        options: ['5 weights: 1, 3, 9, 27, 81 kg', '4 weights: 1, 2, 4, 8 kg', '6 weights: 1, 2, 4, 8, 16, 32 kg', '5 weights: 1, 5, 10, 25, 50 kg'],
        correctOption: 0,
        explanation: 'Ternary powers (1, 3, 9, 27, 81) allow measuring any integer weight from 1 to 121 kg on a 2-pan balance scale.'
      },
      {
        id: 'ga5',
        title: 'Fifty minutes ago if it was four times as many minutes past 3 o\'clock, how many minutes is it to 6 o\'clock?',
        type: 'Aptitude',
        difficulty: 'Hard',
        options: ['26 minutes', '20 minutes', '34 minutes', '15 minutes'],
        correctOption: 0,
        explanation: 'Minutes past 3:00 50 mins ago = x. Time now = 3:00 + x + 50. Total minutes 3:00 to 6:00 = 180. Solving yields 26 minutes to 6:00.'
      },
      {
        id: 'ga6',
        title: 'If a clock takes 7 seconds to strike 7, how long will the same clock take to strike 10?',
        type: 'Aptitude',
        difficulty: 'Medium',
        options: ['10.5 seconds', '10 seconds', '9.5 seconds', '11 seconds'],
        correctOption: 0,
        explanation: '7 strikes have 6 interval gaps taking 7s => 1 interval = 7/6s. 10 strikes have 9 interval gaps => 9 * (7/6) = 10.5 seconds.'
      },
      {
        id: 'ga7',
        title: 'Two trains start from stations A and B 50 km apart towards each other at 50 km/h. A bird flies back and forth between them at 100 km/h. How far did the bird fly?',
        type: 'Aptitude',
        difficulty: 'Hard',
        options: ['100 km', '50 km', '75 km', '120 km'],
        correctOption: 0,
        explanation: 'Relative train speed = 100 km/h. Time to collision = 50km / 100km/h = 0.5h. Bird flies 100 km/h * 1h total travel = 100 km.'
      },
      {
        id: 'ga8',
        title: 'Complete the mathematical series: 5, 20, 24, 6, 2, 8, ?',
        type: 'Logical',
        difficulty: 'Medium',
        options: ['12', '16', '10', '14'],
        correctOption: 0,
        explanation: 'Pattern with 4: 5*4=20, 20+4=24, 24/4=6, 6-4=2, 2*4=8, 8+4=12.'
      },
      {
        id: 'ga9',
        title: 'Two towers are 150 ft and 200 ft tall. A grain is placed between them such that two birds from tower tops reach it simultaneously. Distance of grain from 150 ft tower (if towers are 250 ft apart):',
        type: 'Aptitude',
        difficulty: 'Hard',
        options: ['90 ft', '100 ft', '120 ft', '80 ft'],
        correctOption: 0,
        explanation: 'Equating distances squared: 150^2 + x^2 = 200^2 + (250-x)^2 => 22500 + x^2 = 40000 + 62500 - 500x + x^2 => 500x = 80000 => x = 90 ft.'
      },
      {
        id: 'ga10',
        title: 'A person was 80 years old in 490 BC and 70 years old in 500 BC. In which year was he born?',
        type: 'Logical',
        difficulty: 'Medium',
        options: ['570 BC', '470 BC', '510 BC', '430 BC'],
        correctOption: 0,
        explanation: 'BC years count backwards. Born in 570 BC => In 500 BC age is (570-500) = 70, in 490 BC age is (570-490) = 80.'
      },
      {
        id: 'ga11',
        title: 'A person travels to a city at 10 mph and returns back along the same route at 15 mph. What is their average speed?',
        type: 'Aptitude',
        difficulty: 'Medium',
        options: ['12 mph', '12.5 mph', '11.5 mph', '13 mph'],
        correctOption: 0,
        explanation: 'Harmonic mean = 2 * 10 * 15 / (10 + 15) = 300 / 25 = 12 mph.'
      },
      {
        id: 'ga12',
        title: 'A frog in a 30-meter deep well climbs 3 meters during day and slips 2 meters during night. How many days will it take to come out?',
        type: 'Logical',
        difficulty: 'Medium',
        options: ['27 days', '30 days', '28 days', '29 days'],
        correctOption: 0,
        explanation: 'Net progress per day = 1m. On day 27, it reaches 27m + 3m = 30m and climbs out before slipping!'
      },
      {
        id: 'ga13',
        title: 'Raju wants to distribute Rs 1000 to his 5 children in Arithmetic Progression. What is the share of the youngest child?',
        type: 'Aptitude',
        difficulty: 'Medium',
        options: ['Rs 160', 'Rs 200', 'Rs 150', 'Rs 180'],
        correctOption: 0,
        explanation: '5a = 1000 => a = 200. With common difference d = 20, youngest share = a - 2d = 160.'
      },
      {
        id: 'ga14',
        title: 'Fresh fruit contains 72% water while dry fruit contains 20% water. From 100 grams of fresh fruit, how much dry fruit can be obtained?',
        type: 'Aptitude',
        difficulty: 'Hard',
        options: ['35 grams', '30 grams', '40 grams', '28 grams'],
        correctOption: 0,
        explanation: 'Solid content in 100g fresh fruit = 28g. Dry fruit has 80% solid content => Weight = 28 / 0.80 = 35 grams.'
      },
      {
        id: 'ga15',
        title: 'How many two-digit numbers have their square ending with 8?',
        type: 'Logical',
        difficulty: 'Easy',
        options: ['0', '2', '4', '8'],
        correctOption: 0,
        explanation: 'No perfect square in mathematics ends in 2, 3, 7, or 8. Thus, 0 numbers.'
      },
      {
        id: 'ga16',
        title: '100 light bulbs numbered 1 to 100 are toggled by 100 people according to multiples. How many bulbs stay ON at the end?',
        type: 'Logical',
        difficulty: 'Medium',
        options: ['10 bulbs', '50 bulbs', '25 bulbs', '1 bulb'],
        correctOption: 0,
        explanation: 'Only perfect square numbered bulbs (1, 4, 9, 16, 25, 36, 49, 64, 81, 100) have an odd number of factors and remain ON.'
      },
      {
        id: 'ga17',
        title: 'In how many years will $1,200 amount to $1,323 at 5% p.a. compound interest?',
        type: 'Aptitude',
        difficulty: 'Medium',
        options: ['2 years', '3 years', '1.5 years', '4 years'],
        correctOption: 0,
        explanation: '1323 / 1200 = (21/20)^2 => (1 + 5/100)^2 => n = 2 years.'
      },
      {
        id: 'ga18',
        title: 'The sum of three consecutive numbers is 132. Find the square of the largest number.',
        type: 'Aptitude',
        difficulty: 'Easy',
        options: ['2025', '1936', '1849', '2116'],
        correctOption: 0,
        explanation: '3x = 132 => x = 44. Largest number = 45. 45^2 = 2025.'
      },
      {
        id: 'ga19',
        title: 'Father\'s age is 5 times his son\'s age. Four years ago father was 9 times as old as his son. What are their present ages?',
        type: 'Aptitude',
        difficulty: 'Medium',
        options: ['Father 40, Son 8', 'Father 35, Son 7', 'Father 45, Son 9', 'Father 50, Son 10'],
        correctOption: 0,
        explanation: 'F = 5S. F - 4 = 9(S - 4) => 5S - 4 = 9S - 36 => 4S = 32 => S = 8, F = 40.'
      },
      {
        id: 'ga20',
        title: 'A bag has 10 Red, 10 Blue, 10 Green, 10 Yellow, and 10 White balls. What is the minimum number of balls required to guarantee a pair of at least one color?',
        type: 'Logical',
        difficulty: 'Medium',
        options: ['6 balls', '5 balls', '11 balls', '10 balls'],
        correctOption: 0,
        explanation: 'By Pigeonhole Principle: drawing 5 balls could draw 1 of each of 5 colors. The 6th ball must match one of the 5 colors, forming a pair.'
      }
    ]
  }
];

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'hr_1',
    questionText: 'Tell me about yourself and why you are interested in joining our organization as a Campus Recruit.',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'TCS',
    suggestedAnswer: 'Start with your name, UCEK branch, core technical stack, key projects, internship experience, and align your personal growth with the company mission.'
  },
  {
    id: 'hr_2',
    questionText: 'Describe a challenging situation during your final year project where team conflict arose. How did you resolve it?',
    category: 'HR & Behavioral',
    difficulty: 'Medium',
    companyTag: 'TCS',
    suggestedAnswer: 'Use the STAR method (Situation, Task, Action, Result). Highlight active listening, objective data-driven compromise, and delivering on target.'
  },
  {
    id: 'inf_1',
    questionText: 'Why do you want to join Infosys as a Systems Engineer / Specialist Programmer, and where do you see yourself in 3 years?',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'Infosys',
    suggestedAnswer: 'Discuss Infosys learning ecosystem (Mysore Training Center), continuous upskilling, and contribution to enterprise digital transformation.'
  },
  {
    id: 'inf_2',
    questionText: 'What is the difference between Process and Thread? Explain how Context Switching works.',
    category: 'Technical',
    difficulty: 'Medium',
    companyTag: 'Infosys',
    suggestedAnswer: 'A process is an isolated program in execution with its own memory space. A thread is a lightweight execution unit inside a process sharing memory space.'
  },
  {
    id: 'wip_1',
    questionText: 'How do you prioritize multiple tasks when working under tight deadlines in a multi-client project team?',
    category: 'Situational',
    difficulty: 'Medium',
    companyTag: 'Wipro',
    suggestedAnswer: 'Prioritize by business impact and urgency. Communicate early with team leads to clarify requirements and prevent bottlenecks.'
  },
  {
    id: 'wip_2',
    questionText: 'Describe a project where you had to learn a new technology or programming language quickly.',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'Wipro',
    suggestedAnswer: 'Focus on your structured learning approach, documentation research, building a prototype, and delivering the module on schedule.'
  },
  {
    id: 'acc_1',
    questionText: 'Accenture focuses heavily on innovation and emerging tech. Share an example of how you used creative problem-solving in a project.',
    category: 'HR & Behavioral',
    difficulty: 'Hard',
    companyTag: 'Accenture',
    suggestedAnswer: 'Detail how you identified an operational flaw or bottleneck, researched innovative tools, and implemented an optimized automated solution.'
  },
  {
    id: 'acc_2',
    questionText: 'How do you handle constructive criticism or feedback from a senior developer or team mentor?',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'Accenture',
    suggestedAnswer: 'Emphasize a growth mindset, taking feedback objectively, implementing changes promptly, and asking clarifying questions to improve code quality.'
  },
  {
    id: 'gen_1',
    questionText: 'What are your key strengths and what is one technical area you are actively working to improve?',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'General HR',
    suggestedAnswer: 'Share 2 technical strengths backed by project work, and 1 area you are actively improving via certifications or daily coding practice.'
  },
  {
    id: 'gen_2',
    questionText: 'If you are given two high-priority tasks with tight deadlines simultaneously by two different project leads, how will you manage?',
    category: 'Situational',
    difficulty: 'Hard',
    companyTag: 'General HR',
    suggestedAnswer: 'Communicate transparently with both leads, assess business impact/dependencies, propose realistic split timelines, and escalate if blocking.'
  }
];

export const SENIOR_MENTORS: SeniorMentor[] = [
  {
    id: 'ment_1',
    name: 'Devika Suresh',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    role: 'Software Engineer I',
    company: 'Google',
    domain: 'Software Engineering',
    bio: 'UCEK CSE Alumna (2025). Cracked Google Off-Campus & TCS Digital. Specializes in LeetCode algorithms, mock tech interviews, and ATS resume polish.',
    rating: 4.9,
    availability: '3 hrs / week'
  },
  {
    id: 'ment_2',
    name: 'Rahul Krishna',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    role: 'Embedded Systems Specialist',
    company: 'Texas Instruments',
    domain: 'Core Electronics & Embedded',
    bio: 'UCEK ECE Alumnus (2024). Placed at TI with focus on ARM Cortex microcontrollers, RTOS, & hardware prototyping.',
    rating: 4.8,
    availability: '2 hrs / week'
  },
  {
    id: 'ment_3',
    name: 'Ananya Pillai',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    role: 'Data Scientist',
    company: 'Amazon',
    domain: 'Data Science & AI',
    bio: 'UCEK IT Alumna (2024). Expert in ML pipelines, Python analytics, SQL case studies, and Amazon STAR behavioral interview rounds.',
    rating: 5.0,
    availability: '4 hrs / week'
  }
];

export const INITIAL_MENTORSHIP: MentorshipPair = {
  id: 'pair_101',
  mentorId: 'ment_1',
  mentorName: 'Devika Suresh',
  mentorCompany: 'Google',
  mentorRole: 'Software Engineer I',
  menteeId: 'usr_mentee_1',
  menteeName: 'Anand Nair',
  status: 'Active',
  nextMeetingDate: '2026-08-05 (Wed) @ 6:00 PM',
  logs: [
    {
      id: 'log_1',
      date: '2026-07-28',
      topic: 'Initial Diagnostic & Resume Review',
      feedback: 'Anand has solid foundational knowledge in Java & DSA. Resume needs quantified impact metrics in final year web app project.',
      actionItems: ['Quantify project metrics with STAR method', 'Solve 15 Sliding Window problems on LeetCode', 'Take TCS Mock Drive']
    }
  ]
};

export const INITIAL_RECENT_SCORES: TestResult[] = [];

export const INITIAL_RESUME_DATA: ResumeData = {
  template: 'ats',
  personal: {
    fullName: 'Anand Nair',
    email: 'anand.nair@ucek.ac.in',
    phone: '+91 98765 43210',
    location: 'Trivandrum, Kerala',
    linkedIn: 'linkedin.com/in/anandnair-ucek',
    github: 'github.com/anandnair-ucek',
    summary: 'Proactive 4th-year Computer Science Engineering student at UCEK with expertise in React, TypeScript, Node.js, and Data Structures. Passionate about building high-performance web applications and solving complex algorithmic challenges.'
  },
  education: [
    {
      id: 'edu_1',
      institution: 'University College of Engineering Kariavattom (UCEK)',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Science and Engineering',
      startDate: '2022',
      endDate: '2026',
      gpa: '8.4 / 10 CGPA'
    }
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'Technopark Student Interns',
      position: 'Frontend Developer Intern',
      startDate: 'May 2025',
      endDate: 'July 2025',
      isCurrent: false,
      bullets: [
        'Developed responsive React UI components reducing load time by 35% across 4 primary modules.',
        'Integrated REST APIs with Axios and implemented Redux state management for 1,200 daily active users.'
      ]
    }
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Smart Campus Placement Portal',
      techStack: 'React, TypeScript, Tailwind CSS, Node.js',
      description: 'Built a centralized campus recruitment platform featuring automated ATS resume parsing and timed mock test drives.',
      link: 'github.com/anandnair-ucek/placement-portal',
      bullets: [
        'Architected real-time quiz engine supporting 500+ concurrent student exam submissions.',
        'Engineered AI resume review system evaluating keyword match accuracy with 92% precision.'
      ]
    }
  ],
  skills: [
    { id: 'sk_1', category: 'Programming Languages', items: 'JavaScript, TypeScript, Java, C++, Python, SQL' },
    { id: 'sk_2', category: 'Web Frameworks & Libraries', items: 'React.js, Node.js, Express, HTML5, CSS3, Tailwind CSS' },
    { id: 'sk_3', category: 'Tools & Databases', items: 'Git, GitHub, VS Code, Postman, MySQL, MongoDB' }
  ],
  certifications: [
    'NPTEL Online Certification: Data Structures & Algorithms in Java (Elite Badge)',
    'Meta Front-End Developer Professional Certificate (Coursera)'
  ]
};
