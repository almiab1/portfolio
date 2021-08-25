// ----------------------------------------------------------------
// List of with the projects data
// ----------------------------------------------------------------

var projects_data = [
  {
    title: "Neuroevolutionary AI",
    sort_about: "AI by Neuroevotulion method for MTG",
    about: 'Strategy learning in complex environments with agents is currently one of the most important topics in the field of Artificial Intelligence (AI). This type of approach allows adapting to complex environments with good performance, therefore environments such as strategy or card games are perfect for the application of adaptive perspective approaches due to the high variability they present. The Gathering (MTG) is a turn-based card game, known for its high complexity given the large number of cards it contains and the rules by which it is governed, is a clear example of a complex environment. This paper presents the application of one of the AI methods available in the field of machine learning capable of learning and adapting to complex and variant environments, which is able to play MTG intelligently and competitively. This is done through the creation of an environment focused on applying the chosen strategy, as well as the evaluation of the complexity of the learning task. A self-developed framework is implemented, which is responsible for applying the neuroevolutionary method and executing the various trainings.',
    filter: "ai",
    id_tarjects: ["AI", "Machine Learning", "Neuroevolution", "MTG"],
    main_img: "./src/img/tfg.png",
    imgs: ["./src/img/tfg.png"],
    datetime: "2021-7-22",
    sort_data: "2021",
    links: { github: "https://github.com/almiab1/AI_Neuroevolution_MTG" }
  },
  {
    title: "Multimedia Experience AR / VR",
    sort_about: "AR and VR game made by Unity",
    about: "Project focused on the creation of an augmented reality (AR) and virtual reality (VR) experience based on the Egyptian game Senet. The project consists of two parts, the first focused on AR and the second on VR. The AR part consists of a mobile application adding AR mini-games to the physical Senet game. On the other hand, the VR part consists of an immersive experience where an interpretation of the afterlife will be shown, which can be enjoyed either in a mobile version using the Google Cardboard or through a desktop application for VR glasses such as the Oculus Rift.",
    filter: "game",
    id_tarjects: ["Unity", "Augmented Reality", "Virtual Reality", "C#"],
    main_img: "./src/img/senet.png",
    imgs: ["./src/img/senet.png"],
    datetime: "2021-1-14",
    sort_data: "2020 - 2021",
    links: { github: "https://gitlab.com/real-delusion/senet-ar-vr" }
  },
  {
    title: "Cookobot",
    sort_about: "Robot witch cross-platform ecosystem",
    about: "Cookobot is a robotics project for Turtlebot3 Burger, consisting of the configuration and implementation of an automaton that performs the functions of a waiter. Based on ROS (Robot Operating System) and making use of technologies such as OpenCV and TensorFlow, it performs the tasks autonomously. It has a webapp implemented with Electron, VueJS and Bulma.",
    filter: "electronic web",
    id_tarjects: ["ROS", "VueJS", "Bulma", "TensorFlow"],
    main_img: "./src/img/cookobot.png",
    imgs: ["./src/img/cookobot.png"],
    datetime: "2020-6-2",
    sort_data: "2020",
    links: { github: "https://github.com/Real-Delusion/cookobot-app" }
  },
  {
    title: "Lost Scout",
    sort_about: "3D video game based on puzzles",
    about: "Lost Scout is a video game with low poly aesthetics and free camera where the player must overcome the levels by solving different puzzles, making use of the elements of the environment such as: logs, ropes, ladders, pressure plates and levers. The ultimate goal is to solve all levels/puzzles through logic to reach the camp.",
    filter: "game",
    id_tarjects: ["Unity", "C#", "3D Studio Max"],
    main_img: "./src/img/lostScout2.png",
    imgs: ["./src/img/lostScout2.png"],
    datetime: "2019-6-22",
    sort_data: "2019",
    links: { github: "https://github.com/Real-Delusion/lost-scout" }
  },
  {
    title: "Smart Scale",
    sort_about: "Smart scale with mobile app",
    about: "Smart Scale is a project to convert any digital scale into an smart one using an ESP32 microcontroller and an Android based app. The ESP32 reads value from the scale sensor (with a custom algorithm to get stabilized weights), shows it through the LCD screen and sends it to Firebase. Then users can check and track the weight progress with the app. ",
    filter: "electronic",
    id_tarjects: ["Android", "Firebase", "ESP32"],
    main_img: "./src/img/smartScale.png",
    imgs: ["./src/img/smartScale.png"],
    datetime: "2020-6-2",
    sort_data: "2018",
    links: { github: "https://github.com/Smart-Home-IoT-Project" }
  },
  {
    title: "Remote crop monitoring",
    sort_about: "Remote crop monitoring by sensor system",
    about: " It is an agricultural monitoring system based on the location of humidity, temperature and light. It features a Sparkfun ESP8226 Thing Dev microcontroller that reads data from a custom-designed printed circuit board (where a set of affordable sensors and a GPS are connected) and sends the data to an Express and MySqlite server. Users can view all this information on a map on a web page.",
    filter: "electronic web",
    id_tarjects: ["JavaScript", "Arduino", "MySqlite", "Express"],
    main_img: "./src/img/fieldSensors.png",
    imgs: ["./src/img/fieldSensors.png"],
    datetime: "2018-6-14",
    sort_data: "2017 - 2018",
    links: { github: "" }
  },
]

// ----------------------------------------------------------------
// Instanciation vue
// ----------------------------------------------------------------

const my_projects = new Vue({
  el: '#my_projects',
  data: {
    projects: projects_data
  }
})


const contact_interactive = new Vue({
  el: '#contact_interactive',
  data: {
    git_btn_active: false,
    linkedin_btn_active: false,
    mail_btn_active: false,
  }
})