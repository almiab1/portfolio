// ----------------------------------------------------------------
// List of with the projects data
// ----------------------------------------------------------------

var projects_data = [
  {
    title: "Neuroevolutionary AI",
    sort_about: "AI by Neuroevotulion method for MTG",
    about: "AI by Neuroevotulion method for MTG",
    filter: "ai",
    id_tarjects: ["AI", "Machine Learning", "Neuroevolution", "MTG"],
    main_img: "src/media/img/tfg.png",
    imgs: ["src/media/img/tfg.png"],
    datetime: "2021-7-22",
    sort_data: "2021"
  },
  {
    title: "Cookobot",
    sort_about: "Robot witch cross-platform ecosystem",
    about: "Robot witch cross-platform ecosystem",
    filter: "electronic web",
    id_tarjects: ["ROS", "VueJS", "Bulma", "TensorFlow"],
    main_img: "src/media/img/cookobot.png",
    imgs: ["src/media/img/cookobot.png"],
    datetime: "2020-6-2",
    sort_data: "2020"
  },
  {
    title: "Lost Scout",
    sort_about: "3D video game based on puzzles",
    about: "3D video game based on puzzles",
    filter: "game",
    id_tarjects: ["Unity","C#","3D Studio Max"],
    main_img: "src/media/img/lostScout2.png",
    imgs: ["src/media/img/lostScout2.png"],
    datetime: "2019-6-22",
    sort_data: "2019"
  },
  {
    title: "Smart Scale",
    sort_about: "Smart scale with mobile app",
    about: "Smart scale with mobile app",
    filter: "electronic",
    id_tarjects: ["Android", "Firebase", "ESP32"],
    main_img: "src/media/img/smartScale.png",
    imgs: ["src/media/img/smartScale.png"],
    datetime: "2020-6-2",
    sort_data: "2020"
  },
  {
    title: "Remote crop monitoring",
    sort_about: "Remote crop monitoring by sensor system",
    about: "Remote crop monitoring by sensor system",
    filter: "electronic web",
    id_tarjects: ["JavaScript", "Arduino", "MySqlite", "Express"],
    main_img: "src/media/img/fieldSensors.png",
    imgs: ["src/media/img/fieldSensors.png"],
    datetime: "2018-6-14",
    sort_data: "2017 - 2018"
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