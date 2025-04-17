"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "../context/WebSocketContext";
import Image from "next/image";

import { API_URL } from "../libs/global";

import { Poppins } from "next/font/google";

import ProfileImage from "@/app/assets/profile.png";
import { UserIcon } from "@heroicons/react/24/outline";
import {
  ChevronRightIcon,
  ArrowUpRightIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/16/solid";
import Patientimg from "@/app/assets/patimg.png";
import Closeicon from "@/app/assets/closeicon.png";
import Search from "@/app/assets/search.png";
import Calendar from "@/app/assets/calendar.png";
import Bigcalendar from "@/app/assets/bigcalender.png";
import Clock from "@/app/assets/clock.png";

import "@/app/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const page = ({ isOpen, onClose, patient, doctor }) => {
  // const parsedUser = JSON.parse(patient);

  console.log("Surgery date " + patient?.surgery_scheduled?.date);

  const periodPriority = ["pre-op", "6w", "3m", "6m", "1y", "2y"];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qisSubmitting, qsetIsSubmitting] = useState(false);
  const [sisSubmitting, ssetIsSubmitting] = useState(false);

  const getLatestPeriod = (questionnaires = []) => {
    let latest = null;
    let maxIndex = -1;

    for (const q of questionnaires) {
      const period = q.period?.toLowerCase(); // Normalize casing
      const index = periodPriority.indexOf(period);
      if (index > maxIndex) {
        maxIndex = index;
        latest = q.period; // Return original casing if needed
      }
    }

    return latest || "Not Available";
  };

  // Usage:
  const latestPeriod = getLatestPeriod(patient?.questionnaire_assigned);
  console.log("Latest period:", patient?.questionnaire_assigned);

  const useWindowSize = () => {
    const [size, setSize] = useState({
      width: 0,
      height: 0,
    });

    useEffect(() => {
      const updateSize = () => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      updateSize(); // set initial size
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }, []);

    return size;
  };

  const { width, height } = useWindowSize();
  // console.log("Screen Width:", width, "Screen Height:", height);

  const [opendrop, setOpendrop] = useState(false);
  const [selectedOptiondrop, setSelectedOptiondrop] = useState("Period");

  const optionsdrop = ["Pre Op", "6W", "3M", "6M", "1Y", "2Y"];

  const [selectedDate, setSelectedDate] = useState("");
  const dateInputRef = useRef(null);

  const handleSelectdrop = (option) => {
    setSelectedOptiondrop(option);
    setOpendrop(false);
  };

  const openDatePicker = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      // const formattedDate = new Date(dateValue).toLocaleDateString("en-GB", {
      //   day: "2-digit",
      //   month: "short",
      //   year: "numeric",
      // });
      setSelectedDate(dateValue);
    }
  };

  const [selectedItems, setSelectedItems] = useState([]);
  const allItems = [
    "Oxford Knee Score (OKS)",
    "Short Form - 12 (SF-12)",
    "Knee Society Score (KSS)",
    "Knee Injury and Ostheoarthritis Outcome Score, Joint Replacement (KOOS, JR)",
    "Forgotten Joint Score (FJS)",
  ];

  const handleCheckboxChange = (item) => {
    setSelectedItems(
      (prevSelected) =>
        prevSelected.includes(item)
          ? prevSelected.filter((i) => i !== item) // remove if already selected
          : [...prevSelected, item] // add if not
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(allItems);
  };
  

  const handleClearAll = () => {
    setSelectedItems([]);
    setSelectedDate("");
    setSelectedOptiondrop("Period"); // or whatever the default option is
  };

  const [searchTerm, setSearchTerm] = useState("");

  const [warning, setWarning] = useState("");

  const handleAssign = async () => {
    if (qisSubmitting) {
      showWarning("Please wait Assigning on progress...");
      return; // Prevent double submission
    }

    if (!selectedOptiondrop || selectedOptiondrop === "Period") {
      setWarning("Please select a Time Period");
      return;
    }

    if (selectedItems.length === 0) {
      setWarning("Please select at least one questionnaire.");
      return;
    }

    if (!selectedDate) {
      setWarning("Please select a deadline.");
      return;
    }

    const selected = new Date(selectedDate);
    const now = new Date();

    // Remove time component to compare only date
    selected.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    if (selected < now) {
      setWarning("Deadline cannot be a past date.");
      setTimeout(() => {
        setWarning("");
      }, 2500);
      return; // prevent submission
    }

    setWarning(""); // Clear any existing warning

    const payload = {
      uhid: patient.uhid,
      questionnaire_assigned: selectedItems.map((item) => ({
        name: item,
        period: selectedOptiondrop,
        assigned_date: new Date().toISOString(), // current date-time in GMT
        deadline: new Date(selectedDate).toISOString(), // selected date converted to GMT
        completed: 0,
      })),
    };

    try {
      const response = await fetch(API_URL + "add-questionnaire", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API Error:", error);
        setWarning("Something went wrong. Please try again.");
        return;
      }

      const result = await response.json();
      console.log("Successfully assigned:", result);
      handleSendremainder();

      // Optionally reset the fields
      setSelectedItems([]);
      setSelectedOptiondrop("Period");
      setSelectedDate("");

      setWarning("Questionnaires successfully assigned!");
      setTimeout(() => setWarning(""), 3000);
    } catch (err) {
      console.error("Network error:", err);
      setWarning("Network error. Please try again.");
    }
  };

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("wss://promapi.onrender.com/ws/message");

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Message from server:", data);
    };

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected");
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const handleSendremainder = async () => {
    if (!patient?.email) {
      alert("Patient email is missing.");
      return;
    }

    try {
      const res = await fetch(API_URL + "send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: patient.email,
          subject: "New Questionnaire Assigned",
          message: "Questionnaire Assigned",
        }),
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: "Invalid JSON response", raw: text };
      }

      console.log("Email send response:", data);

      if (!res.ok) {
        alert("Failed to send email.");
        return;
      }

      alert("✅ Email sent (check console for details)");
      sendRealTimeMessage();
    } catch (error) {
      console.error("❌ Error sending email:", error);
      alert("Failed to send email.");
    } finally {
      qsetIsSubmitting(true);
    }
  };

  const sendRealTimeMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("⚠️ WebSocket is not open. Cannot send message.");
      qsetIsSubmitting(true);
      return;
    }

    const payload = {
      uhid: patient.uhid,
      email: patient.email,
      phone_number: patient.phone_number || "N/A",
      message: `Questionaire Assigned`,
    };

    socket.send(JSON.stringify(payload));
    window.location.reload();
    console.log("📤 Sent via WebSocket:", payload);

    qsetIsSubmitting(true);

    window.location.reload();
  };

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log("Retrieved user from localStorage:", parsedUser);
      setUserData(parsedUser);
    }
  }, []);

  const [searchTermdoc, setSearchTermdoc] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const handleCheckboxChangedoc = (item) => {
    setSelectedDoctor(item);
  };

  const handleClearAlldoc = () => {
    setSelectedDoctor("");
  };

  const handleAssigndoc = async () => {
    if (isSubmitting) {
      showWarning("Please wait Assigning on progress...");
      return; // Prevent double submission
    }

    if (!selectedDoctor) {
      setShowAlert(true);
      setAlertMessage("Please select a doctor.");
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }

    const doctorName = selectedDoctor.split(" - ")[1]; // Extract doctor name
    const patientUhid = patient?.uhid; // Selected patient value

    if (!patientUhid) {
      console.error("No patient selected for assignment.");
      return;
    }

    const payload = {
      uhid: patient.uhid,
      doctor_assigned: doctorName,
    };
    console.log("Doctor assign " + payload);

    setIsSubmitting(true);

    try {
      const response = await fetch(API_URL + "update-doctor", {
        method: "PUT", // or "PUT" depending on your backend
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Doctor assigned successfully:", result);

      window.location.reload();

      // Show an alert box indicating that the UI will update soon
      alert("Doctor assigned. The changes will reflect soon.");

      // Optionally refresh the data or trigger a UI update
    } catch (error) {
      console.error("Error assigning doctor:", error);
      alert("Error assigning doctor, please try again.");
    } finally {
      isSubmitting(true);
    }
  };

  const [selectedDatesurgery, setSelectedDatesurgery] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Refs for hidden inputs
  const dateInputRefsurgery = useRef(null);
  const timeInputRef = useRef(null);

  const handleCalendarClick = () => {
    dateInputRefsurgery.current?.showPicker(); // First open date
  };

  const handleClockClick = () => {
    timeInputRef.current?.showPicker(); // First open date
  };

  const handleDateChangesurgery = (e) => {
    const selectedDate = e.target.value;

    if (!selectedDate) return;

    const today = new Date();
    const selected = new Date(selectedDate);

    // Set time to 00:00:00 to compare only the date part
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      alert("Please select a valid future or current date.");
      return;
    }

    setSelectedDatesurgery(selectedDate);
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleClearAllsurgery = () => {
    setSelectedDatesurgery("");
    setSelectedTime("");
  };

  const handleAssignsurgery = async () => {
    if (sisSubmitting) {
      showWarning("Please wait Assigning on progress...");
      return; // Prevent double submission
    }

    if (!selectedDatesurgery || !selectedTime) {
      setWarning("Please select both date and time.");
      return;
    }

    const selectedDateTime = new Date(`${selectedDatesurgery}T${selectedTime}`);
    const now = new Date();

    if (selectedDateTime < now) {
      setWarning("Selected date and time cannot be in the past.");
      return;
    }

    if (!patient?.uhid) {
      console.error("No patient selected for surgery scheduling.");
      return;
    }

    const payload = {
      uhid: patient.uhid,
      surgery_scheduled: {
        date: selectedDatesurgery,
        time: selectedTime,
      },
    };

    ssetIsSubmitting(true);

    try {
      const response = await fetch(API_URL + "update-surgery-schedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Surgery scheduled successfully:", result);
      window.location.reload();
      // Optionally reset form or show success feedback
    } catch (error) {
      console.error("Error scheduling surgery:", error);
    } finally {
      ssetIsSubmitting(true);
    }
  };

  const columns = ["SCORE", "Preop", "6W", "3M", "6M", "1Y", "2Y"];
  const periodMap = {
    PreOP: "Preop",
    "Pre Op": "Preop",
    "pre op": "Preop",
    "6W": "6W",
    "3M": "3M",
    "6M": "6M",
    "1Y": "1Y",
    "2Y": "2Y",
  };

  let data = [];

  if (patient?.questionnaire_scores) {
    const scoreMap = {};

    patient.questionnaire_scores.forEach((scoreEntry) => {
      const scoreName = scoreEntry.name;
      const period = periodMap[scoreEntry.period] || scoreEntry.period;
      const score = scoreEntry.score[0];

      if (!scoreMap[scoreName]) {
        scoreMap[scoreName] = {};
      }

      scoreMap[scoreName][period] = score;
    });

    data = Object.entries(scoreMap).map(([name, valuesObj]) => {
      const values = columns.slice(1).map((period) => valuesObj[period] ?? "");
      return { label: name, values };
    });
  }

  const getColor = (val) => {
    if (val === "") return "#B0C4C7"; // default light grayish-blue
    const number = parseFloat(val);
    if (isNaN(number)) return "#B0C4C7";
    if (number < 30) return "#C66A85"; // red
    if (number < 50) return "#F4A261"; // orange
    return "#B0C4C7"; // blue
  };

  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  if (!isOpen) return null;

  return (

      <div
        className={`
          h-full w-full flex flex-col items-center
          ${width < 950 ? "gap-4 justify-center" : "justify-center"}
        `}
      >
        <div
          className={`w-full bg-white rounded-2xl p-4  overflow-y-auto overflow-x-hidden h-full ${
            width < 1095 ? "flex flex-col gap-4" : ""
          }`}
        >
          <div
            className={`w-full bg-white  ${width < 760 ? "h-fit" : "h-[20%]"} `}
          >
            <div
              className={`w-full rounded-lg flex ${
                width < 760 ? "py-0" : "py-4"
              }`}
            >
              <div className={`relative w-full`}>
                <div className="absolute top-0 right-0">
                  <Image
                    className={`cursor-pointer ${
                      width < 530 ? "w-4 h-4" : "w-4 h-4"
                    }`}
                    src={Closeicon}
                    alt="close"
                    onClick={() => {
                      onClose();
                      handleClearAll();
                      handleClearAlldoc();
                      handleClearAllsurgery();
                    }}
                  />
                </div>
                <div
                  className={`flex gap-4  flex-col justify-center items-center ${
                    width < 760 ? "" : "py-0"
                  }`}
                >
                  <div
                    className={`w-full flex gap-4 justify-center items-center ${
                      width < 530
                        ? "flex-col justify-center items-center"
                        : "flex-row"
                    }`}
                  >
                    <Image
                      className={`rounded-full w-14 h-14`}
                      src={Patientimg}
                      alt="alex hales"
                    />

                    <div
                      className={`w-full flex items-center ${
                        width < 760
                          ? "flex-col gap-2 justify-center"
                          : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex  flex-col gap-3 ${
                          width < 760 ? "w-full" : "w-2/5"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 flex-row ${
                            width < 530 ? "justify-center" : ""
                          }`}
                        >
                          <p
                            className={`text-[#475467] font-poppins font-semibold text-base ${
                              width < 530 ? "text-start" : ""
                            }`}
                          >
                            Patient Name |
                          </p>
                          <p
                            className={`text-black font-poppins font-bold text-base ${
                              width < 530 ? "text-start" : ""
                            }`}
                          >
                            {patient.first_name + " " + patient.last_name}
                          </p>
                        </div>
                        <div
                          className={`flex flex-row  ${
                            width < 710 && width >= 530
                              ? "w-full justify-between"
                              : ""
                          }`}
                        >
                          <p
                            className={`font-poppins font-semibold text-sm text-[#475467] ${
                              width < 530 ? "text-center" : "text-start"
                            }
                          w-1/2`}
                          >
                            {patient.age}, {patient.gender}
                          </p>
                          <div
                            className={`text-sm font-normal font-poppins text-[#475467] w-1/2 ${
                              width < 530 ? "text-center" : ""
                            }`}
                          >
                            UHID {patient.uhid}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex   ${
                          width < 760 ? "w-full" : "w-3/5 justify-center"
                        }
                      ${
                        width < 530
                          ? "flex-col gap-4 justify-center items-center"
                          : "flex-row"
                      }`}
                      >
                        <div
                          className={` flex flex-col gap-3 ${
                            width < 530
                              ? "justify-center items-center w-full"
                              : "w-[20%]"
                          }`}
                        >
                          <p className="text-[#475467] font-semibold text-5">
                            BMI
                          </p>
                          <p className="text-[#04CE00] font-bold text-6">
                            {patient.bmi}
                          </p>
                        </div>
                        <div
                          className={` flex flex-col gap-3 ${
                            width < 530
                              ? "justify-center items-center w-full"
                              : "w-[40%]"
                          }`}
                        >
                          <p className="text-[#475467] font-semibold text-5">
                            DOCTOR ASSIGNED
                          </p>
                          <p className="text-black font-bold text-6">
                            {patient.doctor_name ? patient.doctor_name : "-"}
                          </p>
                        </div>
                        <div
                          className={` flex flex-col gap-3 ${
                            width < 530
                              ? "justify-center items-center w-full"
                              : "w-[30%]"
                          }`}
                        >
                          <p className="text-[#475467] font-semibold text-5">
                            STATUS
                          </p>
                          <p className="text-[#FFB978] font-bold text-6">
                            {patient.current_status || "NOT YET UPDATED"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-[#005585] h-[1.5px]" />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`w-full  flex  ${
              width < 1095
                ? "h-fit flex-col justify-between gap-8"
                : "h-[35%] mb-2 flex-row"
            }`}
          >
            <div
              className={` bg-white shadow-lg rounded-2xl px-4 py-2 flex flex-col mr-1 justify-between  ${
                width < 1095 ? "w-full  gap-2" : "w-2/5 gap-4"
              }`}
            >
              <h2 className="font-bold text-black text-7">
                ASSIGN QUESTIONNAIRES
              </h2>

              <div
                className={`w-full flex  ${
                  width < 470
                    ? "flex-col justify-center items-center gap-2"
                    : "flex-row"
                }`}
              >
                <div
                  className={`w-[75%] flex flex-row  ${
                    width < 470 ? "justify-between" : "gap-4"
                  }`}
                >
                  <div className="w-[40%] flex flex-row justify-between items-center">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-2 py-1 text-sm w-full text-black outline-none"
                    />
                    <Image src={Search} alt="search" className="w-3 h-3 " />
                  </div>
                  <div className="w-[35%] relative">
                    <div className="flex justify-center">
                      <button
                        // onClick={() => setOpendrop(!opendrop)}
                        className="w-4/5 px-4 flex flex-row gap-2 items-center justify-center py-1 text-sm font-medium italic text-[#475467] rounded-md "
                      >
                        {selectedOptiondrop}
                        {/* {opendrop ? (
                          <ChevronUpIcon className="w-4 h-4 text-[#475467]" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-[#475467]" />
                        )} */}
                      </button>
                    </div>
                    {/* {opendrop && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
                        <ul className="py-1 text-sm text-gray-700">
                          {optionsdrop.map((option, index) => (
                            <li key={index}>
                              <button
                                onClick={() => handleSelectdrop(option)}
                                className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                                  selectedOptiondrop === option
                                    ? "bg-gray-100 font-semibold"
                                    : ""
                                }`}
                              >
                                {option}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )} */}
                  </div>
                </div>
                <div
                  className={`flex flex-row  items-center  cursor-pointer ${
                    width < 470
                      ? "w-full gap-4 justify-center"
                      : "w-[25%] justify-between"
                  }`}
                  onClick={openDatePicker}
                >
                  <p className="font-medium italic text-[#475467] text-sm">
                    {selectedDate
                      ? new Date(selectedDate + "T00:00:00").toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )
                      : "DEADLINE"}
                  </p>
                  <div className="relative">
                    <input
                      type="date"
                      ref={dateInputRef}
                      value={selectedDate} // <-- controlled input
                      onChange={handleDateChange}
                      className="absolute opacity-0 pointer-events-none"
                    />
                    <Image src={Calendar} className="w-3 h-3 " alt="Calendar" />
                  </div>
                </div>
              </div>

              <div
                className={`w-full  overflow-y-auto border rounded-md ${
                  width < 1095 ? "h-36" : "h-24"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  {allItems
                    .filter((item) =>
                      item.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 font-medium  px-4 py-1 text-sm text-black cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item)}
                          onChange={() => handleCheckboxChange(item)}
                          className="accent-[#475467]"
                        />
                        {item}
                      </label>
                    ))}
                </div>
              </div>
              {warning && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                    {warning}
                  </div>
                </div>
              )}

              <div className="w-full flex flex-row justify-center items-center">
                <div className="w-1/3 flex flex-row justify-between items-center">
                  <p
                    className="font-semibold italic text-[#475467] text-sm cursor-pointer"
                    onClick={handleClearAll}
                  >
                    CLEAR ALL
                  </p>
                </div>
                <div className="w-1/3 flex flex-row justify-between items-center">
                  <p
                    className="font-semibold italic text-[#475467] text-sm cursor-pointer"
                    onClick={handleSelectAll}
                  >
                    SELECT ALL
                  </p>
                </div>
                <div className="w-1/3 flex flex-row gap-1 justify-center items-center">
                  <p className="font-medium text-sm text-[#475467]">
                    {" "}
                    Selected
                  </p>
                  <p className="font-semibold test-sm text-black">
                    {selectedItems.length}
                  </p>
                </div>
                <div className="w-1/3 flex flex-row justify-end items-center">
                  <p
                    className="font-semibold rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-sm border-[#005585] border-2"
                    style={{ backgroundColor: "rgba(0, 85, 133, 0.9)" }}
                    onClick={!qisSubmitting ? handleAssign : undefined}
                  >
                    {qisSubmitting ? "ASSIGNING..." : "ASSIGN"}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={` bg-white shadow-lg rounded-2xl px-4 py-2 flex flex-col ml-1 mr-1 justify-between ${
                width < 1095 ? "w-full gap-2" : "w-2/5 gap-4"
              }`}
            >
              {showAlert && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                    Please Select Doctor
                  </div>
                </div>
              )}
              <h2 className="font-bold text-black text-7">ASSIGN DOCTOR</h2>
              <div className="w-full">
                <div className="w-[40%] flex flex-row justify-between items-center">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTermdoc}
                    onChange={(e) => setSearchTermdoc(e.target.value)}
                    className="px-2 py-1 text-sm w-full text-black outline-none"
                  />
                  <Image src={Search} alt="search" className="w-3 h-3 " />
                </div>
              </div>
              <div
                className={`w-full overflow-y-auto border rounded-md ${
                  width < 1095 ? "h-36" : "h-24"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  {doctor
                    .filter((item) =>
                      item.toLowerCase().includes(searchTermdoc.toLowerCase())
                    )
                    .map((item, index) => {
                      const [name, designation] = item.split(" - ");
                      const isSelected = selectedDoctor === item;

                      return (
                        <label
                          key={index}
                          onClick={() => handleCheckboxChangedoc(item)}
                          className={`flex items-center gap-2 justify-center font-medium px-3 py-1 text-sm text-black cursor-pointer hover:bg-gray-50 flex-shrink-0 max-w-fit ${
                            isSelected ? "bg-gray-100" : ""
                          }`}
                        >
                          <div className="w-4 h-4 border-2 rounded-full flex items-center justify-center border-[#475467] mt-1">
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-[#005585]" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">{name}</span>
                            <span className="text-xs text-gray-500">
                              {designation}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
              <div className="w-full flex flex-row justify-center items-center">
                <div className="w-1/2 flex flex-row justify-start items-center">
                  <p
                    className="font-semibold italic text-[#475467] text-sm cursor-pointer"
                    onClick={handleClearAlldoc}
                  >
                    CLEAR SELECTION
                  </p>
                </div>
                <div className="w-1/2 flex flex-row justify-end items-center">
                  <p
                    className="font-semibold rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-sm border-[#005585] border-2"
                    style={{ backgroundColor: "rgba(0, 85, 133, 0.9)" }}
                    onClick={!isSubmitting ? handleAssigndoc : undefined}
                  >
                    {isSubmitting ? "ASSIGNING..." : "ASSIGN"}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`bg-white shadow-lg rounded-2xl px-4 py-2 flex flex-col ml-1 mr-1 justify-between ${
                width < 1095 ? "w-full gap-4" : "w-1/5 gap-4"
              }`}
            >
              <h2 className="font-bold text-black text-7 w-full text-center">
                SURGERY SCHEDULER
              </h2>
              <div className="w-full flex flex-col gap-6">
                <div
                  className={`w-full flex flex-row  ${
                    width < 1095 ? "gap-10" : ""
                  }`}
                >
                  <div
                    className={`flex flex-col ${
                      width < 1095 ? "w-1/2 items-end" : "w-2/3"
                    }`}
                  >
                    <p className="font-medium text-sm text-[#475467]">DATE</p>
                    <p className="font-semibold text-sm italic text-[#475467]">
                      {selectedDatesurgery
                        ? selectedDatesurgery.split("-").reverse().join("/")
                        : "dd/mm/yyyy"}
                    </p>
                  </div>
                  <div
                    className={`flex flex-col  relative gap-4 ${
                      width < 1095
                        ? "w-1/2 justify-center items-start"
                        : "w-1/3 justify-center items-center"
                    }`}
                  >
                    <input
                      type="date"
                      ref={dateInputRefsurgery}
                      className="absolute opacity-0 pointer-events-none"
                      onChange={handleDateChangesurgery}
                    />
                    <Image
                      src={Bigcalendar}
                      alt="clock"
                      className="w-8 h-8 cursor-pointer"
                      onClick={handleCalendarClick}
                    />
                  </div>
                </div>
                <div
                  className={`w-full flex flex-row ${
                    width < 1095 ? "gap-10" : ""
                  }`}
                >
                  <div
                    className={`flex flex-col ${
                      width < 1095 ? "w-1/2 items-end" : "w-2/3"
                    }`}
                  >
                    <p className="font-medium text-sm text-[#475467]">TIME</p>
                    <p className="font-semibold text-sm italic text-[#475467]">
                      {selectedTime ? selectedTime : "HH:MM"}
                    </p>
                  </div>
                  <div
                    className={`flex flex-col relative gap-4 ${
                      width < 1095
                        ? "w-1/2 justify-center items-start"
                        : "w-1/3 justify-center items-center"
                    }`}
                  >
                    <input
                      type="time"
                      ref={timeInputRef}
                      className="absolute opacity-0 pointer-events-none"
                      onChange={handleTimeChange}
                    />

                    <Image
                      src={Clock}
                      alt="clock"
                      className="w-8 h-8 cursor-pointer"
                      onClick={handleClockClick}
                    />
                  </div>
                </div>
              </div>

              {warning && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                    {warning}
                  </div>
                </div>
              )}
              <div
                className={`w-full flex flex-row justify-center items-center ${
                  width < 1095 ? "gap-10" : ""
                }`}
              >
                <div
                  className={`w-1/2 flex flex-row  items-center ${
                    width < 1095 ? "justify-end" : "justify-start"
                  }`}
                >
                  <p
                    className="font-semibold italic text-[#475467] text-sm cursor-pointer"
                    onClick={handleClearAllsurgery}
                  >
                    CLEAR ALL
                  </p>
                </div>
                <div
                  className={`w-1/2 flex flex-row  items-center ${
                    width < 1095 ? "justify-start" : "justify-end"
                  }`}
                >
                  <p
                    className="font-semibold rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-sm border-[#005585] border-2"
                    style={{ backgroundColor: "rgba(0, 85, 133, 0.9)" }}
                    onClick={() => {
                      if (!patient?.doctor_name) {
                        alert("Please assign a doctor first");
                        return;
                      }
                      if (!sisSubmitting) {
                        handleAssignsurgery();
                      } else {
                        undefined;
                      }
                    }}
                  >
                    {sisSubmitting ? "SCHEDULING..." : "SCHEDULE"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`w-full  flex  gap-4 ${
              width < 760 ? "h-fit" : "h-[45%] mt-2"
            }
            ${
              width < 970 ? "flex-col justify-center items-center" : "flex-row"
            }`}
          >
            <div
              className={`bg-white rounded-2xl px-4 py-4 flex flex-col gap-4 shadow-lg ${
                width < 970 ? "w-full" : "w-[55%]"
              }`}
            >
              <p className="w-full font-bold text-[#005585] tracking-[6px]">
                PATIENT REPORTED OUTCOMES
              </p>

              <div className="w-full overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <thead className="bg-[#D9D9D9] text-[#475467] text-[14px] font-medium text-center">
                    <tr>
                      {columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-1.5 text-center">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white text-[14px] font-semibold">
                    {data.length > 0 ? (
                      data.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-[#1F2937]">
                            {row.label}
                          </td>
                          {row.values.map((val, vIdx) => (
                            <td
                              key={vIdx}
                              className="px-4 py-3 text-center"
                              style={{ color: getColor(val) }}
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="px-4 py-4 text-center text-[#9CA3AF]"
                        >
                          No questionnaires answered
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              className={`bg-white rounded-2xl px-4 py-4 flex flex-col justify-between shadow-lg ${
                width < 970 ? "w-full gap-4" : "w-[45%]"
              }`}
            >
              <p className="w-full font-bold text-black">SURGERY DETAILS</p>

              <div
                className={`w-full flex ${width < 530 ? "flex-col gap-4" : "flex-row"}`}
              >
                <div
                  className={`flex flex-row ${width < 530 ? "w-full" : "w-[60%]"}`}
                >
                  <div className="w-1/2 flex flex-col">
                    <p className="font-semibold text-[#475467] text-sm">
                      DATE OF SURGERY
                    </p>
                    <p className="font-medium italic text-[#475467] text-sm">
                      {(() => {
                        const rawDate = patient?.surgery_scheduled?.date;

                        if (!rawDate || rawDate === "0001-01-01") {
                          return "dd/mm/yyyy";
                        }

                        const date = new Date(rawDate);
                        if (isNaN(date)) {
                          return "Invalid date";
                        }

                        return date.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        });
                      })()}
                    </p>
                  </div>
                  <div className="w-1/2 flex flex-col justify-end items-center">
                    <p className="font-semibold text-[#475467] text-sm">
                      SURGEON
                    </p>
                    <p className="font-medium italic text-[#475467] text-sm">
                      {patient?.post_surgery_details?.surgeon ||
                        "Not Available"}
                    </p>
                  </div>
                </div>

                <div
                  className={`flex flex-col ${width < 530 ? "w-full" : "w-[40%]"}`}
                >
                  <p className="font-semibold text-[#475467] text-sm">
                    SURGERY NAME
                  </p>
                  <p className="font-medium italic text-[#475467] text-sm">
                    {patient?.post_surgery_details?.surgery_name ||
                      "Not Available"}
                  </p>
                </div>
              </div>

              <div className="w-full flex flex-col">
                <p className="font-semibold text-[#475467] text-sm">
                  PROCEDURE
                </p>
                <p className="font-medium text-[#475467] text-sm">
                  {patient?.post_surgery_details?.procedure?.toLowerCase() ||
                    "Not Available"}
                </p>
              </div>

              <div
                className={`w-full flex ${width < 570 ? "flex-col gap-4" : "flex-row"}`}
              >
                <div
                  className={`flex flex-col ${width < 570 ? "w-full" : "w-[50%]"}`}
                >
                  <p className="font-semibold text-[#475467] text-sm">
                    IMPLANT
                  </p>
                  <p className="font-medium text-[#475467] text-sm">
                    {patient?.post_surgery_details?.implant || "Not Available"}
                  </p>
                </div>
                <div
                  className={`flex flex-col ${width < 570 ? "w-full" : "w-[50%]"}`}
                >
                  <p className="font-semibold text-[#475467] text-sm">
                    TECHNOLOGY
                  </p>
                  <p className="font-medium italic text-[#475467] text-sm">
                    {patient?.post_surgery_details?.technology ||
                      "Not Available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

  );
};

export default page;
