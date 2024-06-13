document.addEventListener("DOMContentLoaded", function () {
  fetch("https://valorant-api.com/v1/weapons")
    .then((response) => response.json())
    .then((data) => {
      const weapons = data.data;
      const tableBody = document.querySelector("#weapons-table tbody");

      weapons.forEach((weapon) => {
        const row = document.createElement("tr");
        const category = weapon.category.split("::").pop(); // Get the last part after '::'
        const damageRange = weapon.weaponStats?.damageRanges?.[0] || {}; // Use the first range
        const price = weapon.shopData?.cost || "N/A"; // Get the price

        row.innerHTML = `
                            <td><img src="${weapon.displayIcon}" alt="${
          weapon.displayName
        }" class="weapon-icon img-fluid"></td>
                            <td>${weapon.displayName}</td>
                            <td>${price}</td>
                            <td>${damageRange.headDamage || "N/A"}</td>
                            <td>${damageRange.bodyDamage || "N/A"}</td>
                            <td>${damageRange.legDamage || "N/A"}</td>
                        `;
        tableBody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
});
