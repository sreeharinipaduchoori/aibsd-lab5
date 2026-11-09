// MediCare Hospital Management System

// Store data in localStorage
let patients = JSON.parse(localStorage.getItem("patients")) || [];
let doctors = JSON.parse(localStorage.getItem("doctors")) || [];
let appointments = JSON.parse(localStorage.getItem("appointments")) || [];
let bills = JSON.parse(localStorage.getItem("bills")) || [];

let editingAppointmentId = null;
let editingBillId = null;

// Generate unique ID
function generateId(records) {
  return records.length
    ? Math.max(...records.map((record) => Number(record.id))) + 1
    : 1;
}

// Save data
function saveData() {
  localStorage.setItem("patients", JSON.stringify(patients));
  localStorage.setItem("doctors", JSON.stringify(doctors));
  localStorage.setItem("appointments", JSON.stringify(appointments));
  localStorage.setItem("bills", JSON.stringify(bills));
}

// Prevent HTML injection in user-entered text
function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

// ---------------- PAGE NAVIGATION ----------------

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.add("hidden");
  });

  document.getElementById(pageId).classList.remove("hidden");
}

// ---------------- PATIENT CRUD ----------------

// CREATE / UPDATE PATIENT
document
  .getElementById("patientForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const id = document.getElementById("patientId").value;

    const patient = {
      id: id ? Number(id) : generateId(patients),
      name: document.getElementById("patientName").value.trim(),
      age: Number(document.getElementById("patientAge").value),
      gender: document.getElementById("patientGender").value,
      phone: document.getElementById("patientPhone").value.trim(),
      address: document.getElementById("patientAddress").value.trim(),
    };

    if (id) {
      const index = patients.findIndex((p) => p.id === Number(id));
      if (index !== -1) {
        patients[index] = patient;
      }
    } else {
      patients.push(patient);
    }

    saveData();
    renderPatients();
    renderDropdowns();
    updateDashboard();
    resetPatientForm();
  });

// READ PATIENTS
function renderPatients() {
  const table = document.getElementById("patientTable");

  table.innerHTML = patients
    .map(
      (p) => `
        <tr>
            <td>${p.id}</td>
            <td>${escapeHTML(p.name)}</td>
            <td>${p.age}</td>
            <td>${escapeHTML(p.gender)}</td>
            <td>${escapeHTML(p.phone)}</td>
            <td>${escapeHTML(p.address)}</td>
            <td>
                <button onclick="editPatient(${p.id})">Edit</button>
                <button onclick="deletePatient(${p.id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// UPDATE PATIENT
function editPatient(id) {
  const p = patients.find((p) => p.id === id);

  if (!p) return;

  document.getElementById("patientId").value = p.id;
  document.getElementById("patientName").value = p.name;
  document.getElementById("patientAge").value = p.age;
  document.getElementById("patientGender").value = p.gender;
  document.getElementById("patientPhone").value = p.phone;
  document.getElementById("patientAddress").value = p.address;

  showPage("patients");
}

// DELETE PATIENT
function deletePatient(id) {
  const hasAppointments = appointments.some((a) => a.patientId === id);
  const hasBills = bills.some((b) => b.patientId === id);

  if (hasAppointments || hasBills) {
    alert("Delete this patient's appointments and bills first.");
    return;
  }

  if (confirm("Are you sure you want to delete this patient?")) {
    patients = patients.filter((p) => p.id !== id);

    saveData();
    renderPatients();
    renderDropdowns();
    updateDashboard();
  }
}

// RESET PATIENT FORM
function resetPatientForm() {
  document.getElementById("patientForm").reset();
  document.getElementById("patientId").value = "";
}

// ---------------- DOCTOR CRUD ----------------

// CREATE / UPDATE DOCTOR
document
  .getElementById("doctorForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const id = document.getElementById("doctorId").value;

    const doctor = {
      id: id ? Number(id) : generateId(doctors),
      name: document.getElementById("doctorName").value.trim(),
      specialization: document
        .getElementById("doctorSpecialization")
        .value.trim(),
      phone: document.getElementById("doctorPhone").value.trim(),
    };

    if (id) {
      const index = doctors.findIndex((d) => d.id === Number(id));
      if (index !== -1) {
        doctors[index] = doctor;
      }
    } else {
      doctors.push(doctor);
    }

    saveData();
    renderDoctors();
    renderDropdowns();
    updateDashboard();
    resetDoctorForm();
  });

// READ DOCTORS
function renderDoctors() {
  const table = document.getElementById("doctorTable");

  table.innerHTML = doctors
    .map(
      (d) => `
        <tr>
            <td>${d.id}</td>
            <td>${escapeHTML(d.name)}</td>
            <td>${escapeHTML(d.specialization)}</td>
            <td>${escapeHTML(d.phone)}</td>
            <td>
                <button onclick="editDoctor(${d.id})">Edit</button>
                <button onclick="deleteDoctor(${d.id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// UPDATE DOCTOR
function editDoctor(id) {
  const d = doctors.find((d) => d.id === id);

  if (!d) return;

  document.getElementById("doctorId").value = d.id;
  document.getElementById("doctorName").value = d.name;
  document.getElementById("doctorSpecialization").value = d.specialization;
  document.getElementById("doctorPhone").value = d.phone;

  showPage("doctors");
}

// DELETE DOCTOR
function deleteDoctor(id) {
  if (appointments.some((a) => a.doctorId === id)) {
    alert("Delete this doctor's appointments first.");
    return;
  }

  if (confirm("Are you sure you want to delete this doctor?")) {
    doctors = doctors.filter((d) => d.id !== id);

    saveData();
    renderDoctors();
    renderDropdowns();
    updateDashboard();
  }
}

// RESET DOCTOR FORM
function resetDoctorForm() {
  document.getElementById("doctorForm").reset();
  document.getElementById("doctorId").value = "";
}

// ---------------- APPOINTMENT CRUD ----------------

// CREATE / UPDATE APPOINTMENT
document
  .getElementById("appointmentForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const patientId = Number(
      document.getElementById("appointmentPatient").value,
    );
    const doctorId = Number(document.getElementById("appointmentDoctor").value);

    if (!patientId || !doctorId) {
      alert("Please add a patient and doctor first.");
      return;
    }

    const appointment = {
      id: editingAppointmentId ?? generateId(appointments),
      patientId: patientId,
      doctorId: doctorId,
      date: document.getElementById("appointmentDate").value,
      time: document.getElementById("appointmentTime").value,
    };

    if (editingAppointmentId !== null) {
      const index = appointments.findIndex(
        (a) => a.id === editingAppointmentId,
      );
      if (index !== -1) {
        appointments[index] = appointment;
      }
    } else {
      appointments.push(appointment);
    }

    editingAppointmentId = null;

    saveData();
    renderAppointments();
    updateDashboard();

    this.reset();
    this.querySelector('button[type="submit"]').textContent =
      "Book Appointment";
  });

// READ APPOINTMENTS
function renderAppointments() {
  const table = document.getElementById("appointmentTable");

  table.innerHTML = appointments
    .map((a) => {
      const patient = patients.find((p) => p.id === a.patientId);
      const doctor = doctors.find((d) => d.id === a.doctorId);

      return `
            <tr>
                <td>${a.id}</td>
                <td>${escapeHTML(patient ? patient.name : "Unknown")}</td>
                <td>${escapeHTML(doctor ? doctor.name : "Unknown")}</td>
                <td>${escapeHTML(a.date)}</td>
                <td>${escapeHTML(a.time)}</td>
                <td>
                    <button onclick="editAppointment(${a.id})">Edit</button>
                    <button onclick="deleteAppointment(${a.id})">Delete</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

// UPDATE APPOINTMENT
function editAppointment(id) {
  const a = appointments.find((a) => a.id === id);

  if (!a) return;

  editingAppointmentId = id;

  document.getElementById("appointmentPatient").value = a.patientId;
  document.getElementById("appointmentDoctor").value = a.doctorId;
  document.getElementById("appointmentDate").value = a.date;
  document.getElementById("appointmentTime").value = a.time;

  document.querySelector("#appointmentForm button[type='submit']").textContent =
    "Update Appointment";

  showPage("appointments");
}

// DELETE APPOINTMENT
function deleteAppointment(id) {
  if (confirm("Are you sure you want to delete this appointment?")) {
    appointments = appointments.filter((a) => a.id !== id);

    saveData();
    renderAppointments();
    updateDashboard();
  }
}

// ---------------- BILLING CRUD ----------------

// CREATE / UPDATE BILL
document
  .getElementById("billForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const patientId = Number(document.getElementById("billPatient").value);

    if (!patientId) {
      alert("Please select a patient first.");
      return;
    }

    const bill = {
      id: editingBillId ?? generateId(bills),
      patientId: patientId,
      amount: Number(document.getElementById("billAmount").value),
      status: document.getElementById("billStatus").value,
    };

    if (editingBillId !== null) {
      const index = bills.findIndex((b) => b.id === editingBillId);
      if (index !== -1) {
        bills[index] = bill;
      }
    } else {
      bills.push(bill);
    }

    editingBillId = null;

    saveData();
    renderBills();
    updateDashboard();

    this.reset();
    this.querySelector('button[type="submit"]').textContent = "Generate Bill";
  });

// READ BILLS
function renderBills() {
  const table = document.getElementById("billTable");

  table.innerHTML = bills
    .map((b) => {
      const patient = patients.find((p) => p.id === b.patientId);

      return `
            <tr>
                <td>${b.id}</td>
                <td>${escapeHTML(patient ? patient.name : "Unknown")}</td>
                <td>${b.amount.toFixed(2)}</td>
                <td>${escapeHTML(b.status)}</td>
                <td>
                    <button onclick="editBill(${b.id})">Edit</button>
                    <button onclick="deleteBill(${b.id})">Delete</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

// UPDATE BILL
function editBill(id) {
  const b = bills.find((b) => b.id === id);

  if (!b) return;

  editingBillId = id;

  document.getElementById("billPatient").value = b.patientId;
  document.getElementById("billAmount").value = b.amount;
  document.getElementById("billStatus").value = b.status;

  document.querySelector("#billForm button[type='submit']").textContent =
    "Update Bill";

  showPage("billing");
}

// DELETE BILL
function deleteBill(id) {
  if (confirm("Are you sure you want to delete this bill?")) {
    bills = bills.filter((b) => b.id !== id);

    saveData();
    renderBills();
    updateDashboard();
  }
}

// ---------------- DROPDOWN MANAGEMENT ----------------

function renderDropdowns() {
  const patientOptions = patients
    .map((p) => `<option value="${p.id}">${escapeHTML(p.name)}</option>`)
    .join("");

  const doctorOptions = doctors
    .map((d) => `<option value="${d.id}">${escapeHTML(d.name)}</option>`)
    .join("");

  document.getElementById("appointmentPatient").innerHTML =
    '<option value="">Select Patient</option>' + patientOptions;

  document.getElementById("billPatient").innerHTML =
    '<option value="">Select Patient</option>' + patientOptions;

  document.getElementById("appointmentDoctor").innerHTML =
    '<option value="">Select Doctor</option>' + doctorOptions;
}

// ---------------- DASHBOARD ----------------

function updateDashboard() {
  document.getElementById("patientCount").textContent = patients.length;
  document.getElementById("doctorCount").textContent = doctors.length;
  document.getElementById("appointmentCount").textContent = appointments.length;
  document.getElementById("billCount").textContent = bills.length;
}

// ---------------- INITIALIZATION ----------------

document.addEventListener("DOMContentLoaded", function () {
  renderPatients();
  renderDoctors();
  renderDropdowns();
  renderAppointments();
  renderBills();
  updateDashboard();
  showPage("dashboard");
});
