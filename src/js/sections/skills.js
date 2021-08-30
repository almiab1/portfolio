// ----------------------------------------------------------------
// List of with the projects data
// ----------------------------------------------------------------

var soft_skills_data = [
    {
        name: "Team Working",
        value: 100 
    },
    {
        name: "Effective Communication",
        value: 65 
    },
    {
        name: "Analysis capacity",
        value: 75 
    },
    {
        name: "Agile Managment",
        value: 65 
    },
    {
        name: "Scrum",
        value: 85 
    },
    {
        name: "Projects management",
        value: 75 
    },
    {
        name: "Technology Early Adopter",
        value: 95 
    },
    {
        name: "Lifelong Learning",
        value: 100 
    },
    {
        name: "Critical Thinking",
        value: 75 
    },
  ]


var software_skills_data = [
    {
        name: "Python",
        value: 85 
    },
    {
        name: "C++",
        value: 75 
    },
    {
        name: "Java",
        value: 75 
    },
    {
        name: "C#",
        value: 85 
    },
    {
        name: "JavaScript",
        value: 75 
    },
    {
        name: "Node.js",
        value: 65 
    },
    {
        name: "Git",
        value: 90 
    },
    {
        name: "SQL",
        value: 50 
    },
    {
        name: "VueJS",
        value: 70 
    },
    {
        name: "Ionic",
        value: 75 
    },
    {
        name: "TypeScript",
        value: 75 
    },
    {
        name: "Unix shell (Bash) ",
        value: 60 
    },
  ]

var enviroments_data = [
    {
        name: "Unity",
        value: 80 
    },
    {
        name: "AWS",
        value: 60 
    },
    {
        name: "3D Studio Max ",
        value: 25
    },
]
  // ----------------------------------------------------------------
  // Instanciation vue
  // ----------------------------------------------------------------
  
  const my_skills = new Vue({
    el: '#my_skills',
    data: {
        soft_skills: soft_skills_data,
        software_skills: software_skills_data,
        enviroments: enviroments_data,
    },
    methods: {
      isMobile:  function() {
        return (document.documentElement.clientWidth <= 800);
      }
    }
  })