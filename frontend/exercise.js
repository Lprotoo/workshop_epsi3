/* Legacy vanilla helper — not used by the React console.
 * The HUD page is frontend/src/pages/Exercise.jsx (route /exercise).
 */
async function loadExercisePlan() {
  try {
    const response = await fetch("http://localhost:8000/get-exercise-plan");
    const data = await response.json();
    const list = document.getElementById("exercise-list");
    list.innerHTML = "";

    if (!data.triggered || !data.plan || data.plan.length === 0) {
      list.innerHTML = "<li class='empty-message'>Aucun exercice recommandé pour le moment</li>";
      return;
    }

    data.plan.forEach(item => {
      const li = document.createElement("li");
      li.className = "exercise-item";
      li.innerHTML = `
        <label>
          <input type="checkbox" ${item.completed ? "checked" : ""} 
            onchange="updateExercise('${item.category}', this.checked)">
          <strong>${item.exercise.name}</strong> (${item.exercise.duration_min} min)
          <br><small>${item.exercise.description}</small>
        </label>
      `;
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Erreur chargement programme sportif:", error);
  }
}

async function updateExercise(category, completed) {
  try {
    await fetch("http://localhost:8000/update-exercise-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, completed })
    });
  } catch (error) {
    console.error("Erreur mise a jour exercice:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadExercisePlan);