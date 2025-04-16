"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
import Smallcalendar from "@/app/assets/smallcalendar.png";
import Male from "@/app/assets/male.png";
import Female from "@/app/assets/female.png";
import Othergender from "@/app/assets/transgender.png";

import "@/app/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const page = ({ isOpenacc, onCloseacc, userData }) => {
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
  const [message, setMessage] = useState("");

  const [showAlert, setShowAlert] = useState(false);

  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    console.log("Raw input value:", dateValue);

    if (dateValue) {
      const selected = new Date(dateValue);
      const today = new Date();

      // Remove time component from today's date
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);

      console.log("Selected Date:", selected.toDateString());
      console.log("Today's Date:", today.toDateString());

      if (selected >= today) {
        console.warn("Invalid birth date selected.");
        alert("Birth date cannot be today or a future date.");
        setSelectedDate(null);
        return;
      }

      const formattedDate = selected.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      console.log("Formatted Date:", formattedDate);
      setSelectedDate(formattedDate);
    }
  };

  const [opendrop, setOpendrop] = useState(false);

  const optionsdrop = [
    "A+",
    "A−",
    "B+",
    "B−",
    "AB+",
    "AB−",
    "O+",
    "O−",
    "A1+",
    "A1−",
    "A2+",
    "A2−",
    "Bombay (hh)",
    "Rh-null",
    "A3",
    "B3",
    "cisAB",
    "In(Lu)",
    "i (little i)",
    "Vel−",
    "Kell+",
    "Kell−",
    "Duffy (Fy a/b)",
    "Kidd (Jk a/b)",
    "MNS (M, N, S, s, U)",
    "Lutheran (Lu a/b)",
    "Lewis (Le a/b)",
    "P1",
    "Diego",
    "Colton",
    "Yt",
    "Xg",
  ];

  const handleSelectdrop = (option) => {
    setSelectedOptiondrop(option);
    setOpendrop(false);
  };

  // Auto calculate BMI whenever height or weight changes

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [uhid, setUhid] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [heightbmi, setHeightbmi] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState("");
  const [selectedGender, setSelectedGender] = useState(""); // "female" | "male" | "other"
  const [doctorAssigned, setDoctorAssigned] = useState("");
  const [adminAssigned, setAdminAssigned] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(0);
  const [selectedOptiondrop, setSelectedOptiondrop] = useState("Select");
  const [selectedDate, setSelectedDate] = useState("");

  const clearAllFields = () => {
    setFirstName("");
    setLastName("");
    setUhid("");
    setSelectedDate("");
    setSelectedGender("");
    setSelectedOptiondrop("Select");
    setPhone("");
    setEmail("");
    setHeightbmi("");
    setWeight("");
    setBmi("");
    setMessage("");
  };

  const [alertMessage, setAlertMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendremainder = async () => {
    if (isSubmitting) {
      showWarning("Please wait submission on progress...");
      return; // Prevent double submission
    }

    if (!firstName.trim()) return showWarning("First Name is required.");
    if (!lastName.trim()) return showWarning("Last Name is required.");
    if (!uhid.trim()) return showWarning("UHID is required.");
    if (!selectedDate.trim()) return showWarning("Date of Birth is required.");

    // Calculate age (simple version, assuming DOB format: "YYYY-MM-DD")
    const today = new Date();
    const birthDate = new Date(selectedDate);

    let age = today.getFullYear() - birthDate.getFullYear();

    // Check if the birthday has occurred yet this year
    const hasHadBirthdayThisYear =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    if (!hasHadBirthdayThisYear) {
      age--;
    }

    if (age <= 0) return showWarning("Select Date of Birth Correctly");
    if (!selectedGender.trim()) return showWarning("Gender is required.");
    if (selectedOptiondrop === "Select")
      return showWarning("Blood group must be selected.");
    if (!/^\d{10}$/.test(phone.trim())) {
      return showWarning("Phone number must be exactly 10 digits.");
    }

    if (!email.trim()) return showWarning("Email is required.");
    if (!heightbmi.trim()) return showWarning("Height is required.");
    if (!weight.trim()) return showWarning("Weight is required.");

    // Calculate BMI
    const heightInMeters = parseFloat(heightbmi) / 100;
    const bmi = parseFloat(weight) / (heightInMeters * heightInMeters);

    const payload = {
      uhid: uhid,
      first_name: firstName,
      last_name: lastName,
      password: "patient@123", // change as needed
      dob: selectedDate,
      age: age,
      blood_grp: selectedOptiondrop,
      gender: selectedGender,
      height: parseFloat(heightbmi),
      weight: parseFloat(weight),
      bmi: parseFloat(bmi.toFixed(2)),
      email: email,
      phone_number: phone,
      doctor_assigned: "",
      doctor_name: "", // replace with real data
      admin_assigned: userData?.user?.email, // replace with real data
      admin_name: "",
      questionnaire_assigned: [],
      questionnaire_scores: [],
      surgery_scheduled: {
        date: "yyyy-mm-dd", // replace with actual selected date
        time: "hh:mm AM", // replace with actual selected time
      },
      post_surgery_details: {
        date_of_surgery: "0001-01-01",
        surgeon: "", // replace accordingly
        surgery_name: "", // if different
        procedure: "", // replace
        implant: "", // replace
        technology: "", // replace
      },
      current_status: "PRE OP",
    };

    setIsSubmitting(true); // 🔒 Lock submission

    try {
      const response = await fetch(
        API_URL+"registerpatient",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      console.log("Submission successful:", payload);
      if (!response.ok) {
        throw new Error("Failed to send data.");
      }

      const result = await response.json();
      console.log("Submission successful:", result);
      onCloseacc();
      window.location.reload();
      // Optionally, show success message here
    } catch (error) {
      console.error("Error submitting data:", error);
      showWarning(
        "This UHID, email, or phone number is already used for another patient."
      );
    } finally {
      setIsSubmitting(false); // 🔓 Unlock submission
    }
  };

  useEffect(() => {
    const h = parseFloat(heightbmi);
    const w = parseFloat(weight);

    if (h > 0 && w > 0) {
      const bmiVal = w / ((h / 100) * (h / 100));
      setBmi(bmiVal.toFixed(2));
    } else {
      setBmi("");
    }
  }, [heightbmi, weight]);

  const showWarning = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  if (!isOpenacc) return null;
  return (
    <div
      className="fixed inset-0 z-40 "
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)", // white with 50% opacity
      }}
    >
      <div
        className={`
          min-h-screen w-fit flex flex-col items-center justify-center mx-auto
          ${width < 950 ? "p-4 gap-4 " : "p-4 "}
        `}
      >
        <div
          className={`w-full bg-white rounded-2xl p-4  overflow-y-auto overflow-x-hidden max-h-[90vh] ${
            width < 1095 ? "flex flex-col gap-4" : ""
          }`}
        >
          <div
            className={`w-full bg-white  ${width < 760 ? "h-fit" : "h-[20%]"} `}
          >
            <div
              className={`w-full rounded-lg flex flex-col gap-5 ${
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
                      setMessage("");
                      onCloseacc(); // if onCloserem handles popup close
                      clearAllFields();
                    }}
                  />
                </div>
                <div
                  className={`w-full flex gap-4 flex-col ${
                    width < 530
                      ? "justify-center items-center"
                      : "justify-start items-start "
                  }`}
                >
                  <p className="font-bold text-5 text-black">
                    ACCOUNT CREATION
                  </p>
                  <p className="font-bold text-base text-black">PATIENT</p>
                </div>
              </div>

              <div
                className={`w-full flex  gap-4 ${
                  width < 550 ? "flex-col" : "flex-row"
                }`}
              >
                <div
                  className={`flex flex-col justify-start items-center gap-2 ${
                    width < 550 ? "w-full" : "w-1/2"
                  }`}
                >
                  <input
                    type="text"
                    placeholder="FIRST NAME"
                    className="w-full text-black py-2 px-4 rounded-sm text-base  outline-none"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={{
                      backgroundColor: "rgba(217, 217, 217, 0.5)", // white with 50% opacity
                    }}
                  />
                </div>
                <div
                  className={`flex flex-col justify-center items-end gap-2 ${
                    width < 550 ? "w-full" : "w-1/2"
                  }`}
                >
                  <input
                    type="text"
                    placeholder="LAST NAME"
                    className="w-full text-black py-2 px-4 rounded-sm text-base outline-none"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={{
                      backgroundColor: "rgba(217, 217, 217, 0.5)", // white with 50% opacity
                    }}
                  />
                </div>
              </div>

              <div
                className={`w-full flex  gap-4 ${
                  width < 550 ? "flex-col" : "flex-row"
                }`}
              >
                <div
                  className={`flex flex-col justify-start items-center gap-2 ${
                    width < 550 ? "w-full" : "w-1/2"
                  }`}
                >
                  <input
                    type="text"
                    placeholder="UHID"
                    className="w-full text-black py-2 px-4 rounded-sm text-base outline-none"
                    value={uhid}
                    onChange={(e) => setUhid(e.target.value)}
                    style={{
                      backgroundColor: "rgba(217, 217, 217, 0.5)", // white with 50% opacity
                    }}
                  />
                </div>
                <div
                  className={`flex flex-row justify-start items-center gap-4 ${
                    width < 550 ? "w-full" : "w-1/2"
                  }`}
                >
                  <p
                    className={`text-base font-semibold ${
                      selectedDate ? "text-black" : "text-[#B3B3B3]"
                    }`}
                  >
                    {selectedDate || "DATE OF BIRTH"}
                  </p>
                  <div
                    className="relative cursor-pointer"
                    onClick={openDatePicker}
                  >
                    <input
                      type="date"
                      ref={dateInputRef}
                      onChange={handleDateChange}
                      className="absolute opacity-0 pointer-events-none"
                    />
                    <Image
                      src={Smallcalendar}
                      className="w-7 h-5 "
                      alt="date of birth"
                    />
                  </div>
                </div>
              </div>

              <div
                className={`w-full flex  gap-4 ${
                  width < 550 ? "flex-col" : "flex-row"
                }`}
              >
                <div
                  className={`flex flex-row justify-between items-center gap-2 ${
                    width < 550 ? "w-full" : "w-1/2"
                  }`}
                >
                  {/* Female */}
                  <div
                    onClick={() => setSelectedGender("female")}
                    className={`w-17 h-19 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      selectedGender === "female"
                        ? "border-2 border-[#F5A9B8]"
                        : ""
                    }`}
                    style={{ backgroundColor: "rgba(255, 180, 216, 0.2)" }}
                  >
                    <Image
                      src={Female}
                      alt="female gender"
                      className="w-7 h-7"
                    />
                    <p className="font-medium text-sm text-[#475467]">Female</p>
                  </div>

                  {/* Male */}
                  <div
                    onClick={() => setSelectedGender("male")}
                    className={`w-17 h-19 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      selectedGender === "male"
                        ? "border-2 border-[#98ECFF]"
                        : ""
                    }`}
                    style={{ backgroundColor: "rgba(152, 236, 255, 0.2)" }}
                  >
                    <Image src={Male} alt="male gender" className="w-7 h-7" />
                    <p className="font-medium text-sm text-[#475467]">Male</p>
                  </div>

                  {/* Other */}
                  <div
                    onClick={() => setSelectedGender("other")}
                    className={`w-17 h-19 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      selectedGender === "other"
                        ? "border-2 border-[#5BCEFA]"
                        : ""
                    }`}
                    style={{
                      background: `linear-gradient(to bottom, 
      rgba(91, 206, 250, 0.2), 
      rgba(245, 169, 184, 0.2), 
      rgba(255, 255, 255, 0.2), 
      rgba(245, 169, 184, 0.2), 
      rgba(91, 206, 250, 0.2))`,
                    }}
                  >
                    <Image
                      src={Othergender}
                      alt="other gender"
                      className="w-7 h-7"
                    />
                    <p className="font-medium text-sm text-[#475467]">Other</p>
                  </div>
                </div>

                <div
                  className={`flex flex-row justify-center items-center gap-4 ${
                    width < 550 ? "w-full" : "w-1/2"
                  }`}
                >
                  <p className="w-3/5 font-medium text-[#475467] text-[20px] text-center">
                    Blood Group
                  </p>
                  <div className="w-2/5 relative">
                    <div className="w-full flex justify-center">
                      <button
                        onClick={() => setOpendrop(!opendrop)}
                        className="w-full px-4 flex flex-row gap-2 items-center justify-center py-1 text-sm font-medium italic text-[#475467] rounded-md hover:bg-gray-100"
                      >
                        {selectedOptiondrop}
                        {opendrop ? (
                          <ChevronUpIcon className="w-4 h-4 text-[#475467]" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-[#475467]" />
                        )}
                      </button>
                    </div>

                    {/* ⬇️ Absolute positioned dropdown that won't push content down */}
                    {opendrop && (
                      <div className="z-50 absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-auto">
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
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`w-full flex  gap-4 ${
                  width < 550 ? "flex-col" : "flex-row"
                }`}
              >
                <div
                  className={`flex flex-col justify-start items-center gap-2 ${
                    width < 550 ? "w-full" : "w-1/2"
                  }`}
                >
                  <input
                    type="tel"
                    placeholder="PHONE"
                    className="w-full text-black py-2 px-4 rounded-sm text-base  outline-none"
                    value={phone}
                    maxLength={10}
                    minLength={10}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      backgroundColor: "rgba(217, 217, 217, 0.5)", // white with 50% opacity
                    }}
                  />
                </div>
                <div
                  className={`flex flex-col justify-center items-end gap-2 ${
                    width < 550 ? "w-full" : "w-1/2"
                  }`}
                >
                  <input
                    type="email"
                    placeholder="EMAIL"
                    className="w-full text-black py-2 px-4 rounded-sm text-base outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      backgroundColor: "rgba(217, 217, 217, 0.5)", // white with 50% opacity
                    }}
                  />
                </div>
              </div>

              <div
                className={`w-full flex  gap-4 ${
                  width < 550 ? "flex-col" : "flex-row"
                }`}
              >
                <div
                  className={`flex flex-col justify-start items-center gap-2 ${
                    width < 550 ? "w-full" : "w-2/5"
                  }`}
                >
                  <input
                    type="number"
                    placeholder="HEIGHT (in cm)"
                    value={heightbmi}
                    min="0"
                    onChange={(e) =>
                      setHeightbmi(e.target.value >= 0 ? e.target.value : "")
                    }
                    className="w-full text-black py-2 px-4 rounded-sm text-base outline-none"
                    style={{ backgroundColor: "rgba(217, 217, 217, 0.5)" }}
                  />
                </div>

                <div
                  className={` flex flex-col justify-start items-center gap-2 ${
                    width < 550 ? "w-full" : "w-2/5"
                  }`}
                >
                  <input
                    type="number"
                    placeholder="WEIGHT (in Kg)"
                    value={weight}
                    min="0"
                    onChange={(e) =>
                      setWeight(e.target.value >= 0 ? e.target.value : "")
                    }
                    className="w-full text-black py-2 px-4 rounded-sm text-base outline-none"
                    style={{ backgroundColor: "rgba(217, 217, 217, 0.5)" }}
                  />
                </div>

                <div
                  className={`flex flex-col justify-start items-center gap-2 ${
                    width < 550 ? "w-full" : "w-1/5"
                  }`}
                >
                  <input
                    type="text"
                    placeholder="BMI"
                    value={bmi}
                    readOnly
                    className="w-full text-black py-2 px-4 rounded-sm text-base outline-none bg-gray-200"
                  />
                </div>
              </div>

              <div className="w-full flex flex-row justify-center items-center">
                <div className="w-1/2 flex flex-row justify-start items-center">
                  <p
                    className="font-semibold italic text-[#475467] text-sm cursor-pointer"
                    onClick={clearAllFields}
                  >
                    CLEAR ALL
                  </p>
                </div>
                <div className="w-1/2 flex flex-row justify-end items-center">
                  <p
                    className="font-semibold rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-sm border-[#005585] border-2"
                    style={{ backgroundColor: "rgba(0, 85, 133, 0.9)" }}
                    onClick={!isSubmitting ? handleSendremainder : undefined}
                  >
                    {isSubmitting ? "CREATING..." : "CREATE"}
                  </p>
                </div>
              </div>

              {showAlert && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                    {alertMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
