'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Bed,
  Building2,
  User,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Calendar,
  FileText,
  Clock,
  ShieldCheck,
  Printer,
  Search,
  Filter,
  ArrowRightLeft,
  CreditCard,
  ClipboardList,
  Thermometer,
  Droplets,
  Wind,
  RefreshCw,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  Check,
  Info,
} from 'lucide-react';
import { queueAudio } from '@/lib/queue-chime';
import { formatPatientFullName, calculateClinicalAge } from '@/lib/patient-utils';
import IpdAdmissionA4PrintModal, { IpdAdmissionRecordData } from './IpdAdmissionA4PrintModal';

export interface HospitalBedSlot {
  number: string;
  roomType: string;
  status: 'VACANT' | 'OCCUPIED' | 'SANITIZING' | 'RESERVED';
  o2: boolean;
  suction: boolean;
  ventilator: boolean;
  monitor: boolean;
  infusionPump: boolean;
  negativePressure: boolean;
  critical?: boolean;
  sanitizationCertId: string;
  lastSanitizedAt: string;
  occupant?: {
    name: string;
    uhid: string;
    ageSex: string;
    bloodGroup: string;
    icd10Code: string;
    diagnosis: string;
    doctor: string;
    admittedOn: string;
    edd: string;
    payer: string;
    acuity: 'ROUTINE' | 'EMERGENCY' | 'ICU_CRITICAL' | 'POST_OP';
  };
}

export interface HospitalWardWing {
  id: string;
  name: string;
  shortName: string;
  wingCode: string;
  floor: string;
  category: 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE_SUITE' | 'ICU' | 'ICCU' | 'HDU_ISOLATION' | 'MATERNITY' | 'DAYCARE';
  nursingStation: string;
  dailyRate: string;
  roomRentPerDay: number;
  nursingChargePerDay: number;
  doctorFeePerDay: number;
  equipmentChargePerDay: number;
  beds: HospitalBedSlot[];
}

export interface BedAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender?: string;
    age?: number | null;
    dateOfBirth?: string | null;
    bloodGroup?: string | null;
    phone?: string | null;
    abhaNumber?: string | null;
    address?: string | null;
    city?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    allergies?: string[];
    patientType?: string | null;
    ward?: string | null;
    bedNumber?: string | null;
    attendingDoctor?: string | null;
    vitals?: {
      bp?: string;
      spo2?: number;
      pulse?: number;
      temperature?: number;
    };
  } | null;
  initialWard?: string;
  initialBed?: string;
  onAllocate: (
    patientId: string,
    ward: string,
    bedNumber: string,
    doctor: string,
    admissionType: string,
    notes: string,
    fullAdmissionRecord?: IpdAdmissionRecordData
  ) => void;
}

export const HOSPITAL_WARDS_MASTER: HospitalWardWing[] = [
  {
    id: 'GENERAL_WARD_A',
    name: 'Floor 1: General Medical Ward (Ward A)',
    shortName: 'General Medical Ward A',
    wingCode: 'FL1-GMW-A',
    floor: 'Floor 1 (East Wing)',
    category: 'GENERAL',
    nursingStation: 'Station 1A (Ext. 2101)',
    dailyRate: 'Rs. 1,200/day',
    roomRentPerDay: 1200,
    nursingChargePerDay: 400,
    doctorFeePerDay: 500,
    equipmentChargePerDay: 250,
    beds: [
      {
        number: 'Bed #101',
        roomType: 'Male Bay A',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-101A',
        lastSanitizedAt: '28 Oct, 06:30 AM',
        occupant: {
          name: 'Rameshwar Prasad Verma',
          uhid: 'UHID-2026-0841',
          ageSex: '62Y / M',
          bloodGroup: 'B+',
          icd10Code: 'J44.1',
          diagnosis: 'Acute Exacerbation of COPD',
          doctor: 'Dr. Vikram Malhotra, MD',
          admittedOn: '27 Oct 2026',
          edd: '31 Oct 2026',
          payer: 'PM-JAY Ayushman',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Bed #102',
        roomType: 'Male Bay A',
        status: 'OCCUPIED',
        o2: true,
        suction: false,
        ventilator: false,
        monitor: false,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-102A',
        lastSanitizedAt: '28 Oct, 07:15 AM',
        occupant: {
          name: 'Suresh Chandra Yadav',
          uhid: 'UHID-2026-0892',
          ageSex: '49Y / M',
          bloodGroup: 'O+',
          icd10Code: 'A90',
          diagnosis: 'Dengue Fever with Thrombocytopenia',
          doctor: 'Dr. Rajesh Sharma, MD',
          admittedOn: '28 Oct 2026',
          edd: '01 Nov 2026',
          payer: 'Star Health TPA',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Bed #103',
        roomType: 'Male Bay A',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-103V',
        lastSanitizedAt: 'Today, 08:15 AM',
      },
      {
        number: 'Bed #104',
        roomType: 'Male Bay B',
        status: 'OCCUPIED',
        o2: false,
        suction: false,
        ventilator: false,
        monitor: false,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-104A',
        lastSanitizedAt: '27 Oct, 09:00 AM',
        occupant: {
          name: 'Mahendra Singh Solanki',
          uhid: 'UHID-2026-0914',
          ageSex: '55Y / M',
          bloodGroup: 'A+',
          icd10Code: 'E11.65',
          diagnosis: 'Uncontrolled Type 2 Diabetes Mellitus',
          doctor: 'Dr. Rajesh Sharma, MD',
          admittedOn: '27 Oct 2026',
          edd: '30 Oct 2026',
          payer: 'Self-Pay Private',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Bed #105',
        roomType: 'Male Bay B',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-105A',
        lastSanitizedAt: '28 Oct, 11:20 AM',
        occupant: {
          name: 'Harishankar Tiwari',
          uhid: 'UHID-2026-0938',
          ageSex: '68Y / M',
          bloodGroup: 'AB+',
          icd10Code: 'J18.9',
          diagnosis: 'Community Acquired Lobar Pneumonia',
          doctor: 'Dr. Vikram Malhotra, MD',
          admittedOn: '28 Oct 2026',
          edd: '02 Nov 2026',
          payer: 'CGHS Panel',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Bed #106',
        roomType: 'Female Bay C',
        status: 'VACANT',
        o2: true,
        suction: false,
        ventilator: false,
        monitor: false,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-106V',
        lastSanitizedAt: 'Today, 09:05 AM',
      },
      {
        number: 'Bed #107',
        roomType: 'Female Bay C',
        status: 'OCCUPIED',
        o2: false,
        suction: false,
        ventilator: false,
        monitor: false,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-107A',
        lastSanitizedAt: '26 Oct, 04:00 PM',
        occupant: {
          name: 'Savita Devi Deshmukh',
          uhid: 'UHID-2026-0951',
          ageSex: '52Y / F',
          bloodGroup: 'O+',
          icd10Code: 'N39.0',
          diagnosis: 'Acute Pyelonephritis / Complicated UTI',
          doctor: 'Dr. Neha Kulkarni, DNB',
          admittedOn: '26 Oct 2026',
          edd: '30 Oct 2026',
          payer: 'MediAssist TPA',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Bed #108',
        roomType: 'Female Bay C',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-108A',
        lastSanitizedAt: '28 Oct, 02:30 PM',
        occupant: {
          name: 'Kamla Bai Rathore',
          uhid: 'UHID-2026-0972',
          ageSex: '64Y / F',
          bloodGroup: 'B+',
          icd10Code: 'I10',
          diagnosis: 'Hypertensive Urgency with Vertigo',
          doctor: 'Dr. Priya Patel, MD, DM',
          admittedOn: '28 Oct 2026',
          edd: '31 Oct 2026',
          payer: 'PM-JAY Ayushman',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Bed #109',
        roomType: 'Female Bay D',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-109V',
        lastSanitizedAt: 'Today, 07:45 AM',
      },
      {
        number: 'Bed #110',
        roomType: 'Female Bay D',
        status: 'SANITIZING',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: false,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-110S',
        lastSanitizedAt: 'In Progress (UV Cycle)',
      },
    ],
  },
  {
    id: 'SEMI_PRIVATE_WARD_B',
    name: 'Floor 2: Semi-Private Ward (Ward B)',
    shortName: 'Semi-Private Ward B',
    wingCode: 'FL2-SPW-B',
    floor: 'Floor 2 (West Wing)',
    category: 'SEMI_PRIVATE',
    nursingStation: 'Station 2B (Ext. 2204)',
    dailyRate: 'Rs. 2,500/day',
    roomRentPerDay: 2500,
    nursingChargePerDay: 600,
    doctorFeePerDay: 800,
    equipmentChargePerDay: 400,
    beds: [
      {
        number: 'Room #201',
        roomType: 'Twin Sharing A',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-201A',
        lastSanitizedAt: '27 Oct, 10:00 AM',
        occupant: {
          name: 'Arvind Kumar Joshi',
          uhid: 'UHID-2026-0812',
          ageSex: '47Y / M',
          bloodGroup: 'A+',
          icd10Code: 'K80.20',
          diagnosis: 'Post-Laparoscopic Cholecystectomy Recovery',
          doctor: 'Dr. Amit Verma, MS',
          admittedOn: '27 Oct 2026',
          edd: '30 Oct 2026',
          payer: 'ICICI Lombard TPA',
          acuity: 'POST_OP',
        },
      },
      {
        number: 'Room #202',
        roomType: 'Twin Sharing A',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-202V',
        lastSanitizedAt: 'Today, 08:30 AM',
      },
      {
        number: 'Room #203',
        roomType: 'Twin Sharing B',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-203A',
        lastSanitizedAt: '28 Oct, 01:15 PM',
        occupant: {
          name: 'Meenakshi Sundaram',
          uhid: 'UHID-2026-0865',
          ageSex: '59Y / F',
          bloodGroup: 'O+',
          icd10Code: 'N18.4',
          diagnosis: 'CKD Stage 4 with Volume Overload',
          doctor: 'Dr. Neha Kulkarni, DNB',
          admittedOn: '28 Oct 2026',
          edd: '01 Nov 2026',
          payer: 'HDFC ERGO TPA',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Room #204',
        roomType: 'Twin Sharing B',
        status: 'OCCUPIED',
        o2: true,
        suction: false,
        ventilator: false,
        monitor: false,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-204A',
        lastSanitizedAt: '27 Oct, 06:00 PM',
        occupant: {
          name: 'Prakash Narayan Gupta',
          uhid: 'UHID-2026-0901',
          ageSex: '44Y / M',
          bloodGroup: 'B+',
          icd10Code: 'K35.80',
          diagnosis: 'Acute Appendicitis (Post-Op Day 2)',
          doctor: 'Dr. Amit Verma, MS',
          admittedOn: '27 Oct 2026',
          edd: '30 Oct 2026',
          payer: 'Star Health TPA',
          acuity: 'POST_OP',
        },
      },
      {
        number: 'Room #205',
        roomType: 'Twin Sharing C',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-205V',
        lastSanitizedAt: 'Today, 09:20 AM',
      },
      {
        number: 'Room #206',
        roomType: 'Twin Sharing C',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-206A',
        lastSanitizedAt: '28 Oct, 08:40 AM',
        occupant: {
          name: 'Vandana Sharma',
          uhid: 'UHID-2026-0922',
          ageSex: '38Y / F',
          bloodGroup: 'A-',
          icd10Code: 'A01.0',
          diagnosis: 'Enteric Typhoid Fever on IV Ceftriaxone',
          doctor: 'Dr. Rajesh Sharma, MD',
          admittedOn: '28 Oct 2026',
          edd: '01 Nov 2026',
          payer: 'MediAssist TPA',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Room #207',
        roomType: 'Twin Sharing D',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-207A',
        lastSanitizedAt: '26 Oct, 11:10 AM',
        occupant: {
          name: 'Devendra Nath Tripathi',
          uhid: 'UHID-2026-0949',
          ageSex: '71Y / M',
          bloodGroup: 'O+',
          icd10Code: 'I50.9',
          diagnosis: 'Congestive Heart Failure (NYHA Class II)',
          doctor: 'Dr. Priya Patel, MD, DM',
          admittedOn: '26 Oct 2026',
          edd: '31 Oct 2026',
          payer: 'CGHS Panel',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Room #208',
        roomType: 'Twin Sharing D',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-208V',
        lastSanitizedAt: 'Today, 07:50 AM',
      },
    ],
  },
  {
    id: 'PRIVATE_DELUXE_SUITE',
    name: 'Floor 2: Private Deluxe Single Suite (Ward C)',
    shortName: 'Private Deluxe Suite C',
    wingCode: 'FL2-DLX-C',
    floor: 'Floor 2 (Executive Wing)',
    category: 'PRIVATE_SUITE',
    nursingStation: 'Station 2C (Ext. 2210)',
    dailyRate: 'Rs. 4,800/day',
    roomRentPerDay: 4800,
    nursingChargePerDay: 900,
    doctorFeePerDay: 1200,
    equipmentChargePerDay: 600,
    beds: [
      {
        number: 'Suite #211',
        roomType: 'Single Deluxe Suite',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-211A',
        lastSanitizedAt: '27 Oct, 12:00 PM',
        occupant: {
          name: 'Rajmata Gayatri Devi',
          uhid: 'UHID-2026-0788',
          ageSex: '66Y / F',
          bloodGroup: 'B+',
          icd10Code: 'M17.11',
          diagnosis: 'Total Knee Arthroplasty (Post-Op Rehab)',
          doctor: 'Dr. Siddharth Singhania, MS Ortho',
          admittedOn: '26 Oct 2026',
          edd: '31 Oct 2026',
          payer: 'Niva Bupa Cashless',
          acuity: 'POST_OP',
        },
      },
      {
        number: 'Suite #212',
        roomType: 'Single Deluxe Suite',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-212V',
        lastSanitizedAt: 'Today, 08:00 AM',
      },
      {
        number: 'Suite #213',
        roomType: 'Single Deluxe Suite',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-213V',
        lastSanitizedAt: 'Today, 09:10 AM',
      },
      {
        number: 'Suite #214',
        roomType: 'Single Deluxe Suite',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-214A',
        lastSanitizedAt: '28 Oct, 03:20 PM',
        occupant: {
          name: 'kalyani Industrialist Mehta',
          uhid: 'UHID-2026-0960',
          ageSex: '54Y / M',
          bloodGroup: 'O+',
          icd10Code: 'I20.0',
          diagnosis: 'Post-Coronary Angioplasty Observation',
          doctor: 'Dr. Priya Patel, MD, DM',
          admittedOn: '28 Oct 2026',
          edd: '30 Oct 2026',
          payer: 'Self-Pay Corporate',
          acuity: 'POST_OP',
        },
      },
      {
        number: 'Suite #215',
        roomType: 'VIP Presidential Suite',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-215V',
        lastSanitizedAt: 'Today, 07:30 AM',
      },
      {
        number: 'Suite #216',
        roomType: 'VIP Presidential Suite',
        status: 'RESERVED',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-216R',
        lastSanitizedAt: 'Reserved for Cath-Lab Transfer',
      },
    ],
  },
  {
    id: 'ICU_CCU',
    name: 'Floor 3: Intensive Care Unit (ICU / CCU)',
    shortName: 'Medical & Surgical ICU',
    wingCode: 'FL3-MICU-A',
    floor: 'Floor 3 (Critical Care)',
    category: 'ICU',
    nursingStation: 'ICU Central Console (Ext. 2300)',
    dailyRate: 'Rs. 8,500/day',
    roomRentPerDay: 8500,
    nursingChargePerDay: 2200,
    doctorFeePerDay: 2000,
    equipmentChargePerDay: 1800,
    beds: [
      {
        number: 'ICU Bed #1',
        roomType: 'Critical Ventilator Bay',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        critical: true,
        sanitizationCertId: 'UV-2026-301A',
        lastSanitizedAt: '26 Oct, 05:00 AM',
        occupant: {
          name: 'Bhanwar Lal Choudhary',
          uhid: 'UHID-2026-0744',
          ageSex: '73Y / M',
          bloodGroup: 'A+',
          icd10Code: 'A41.9',
          diagnosis: 'Septic Shock with Acute Respiratory Failure',
          doctor: 'Dr. Vikram Malhotra, MD',
          admittedOn: '26 Oct 2026',
          edd: '03 Nov 2026',
          payer: 'PM-JAY Ayushman',
          acuity: 'ICU_CRITICAL',
        },
      },
      {
        number: 'ICU Bed #2',
        roomType: 'Critical Ventilator Bay',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        critical: true,
        sanitizationCertId: 'UV-2026-302A',
        lastSanitizedAt: '27 Oct, 11:45 PM',
        occupant: {
          name: 'Shanti Devi Agarwal',
          uhid: 'UHID-2026-0830',
          ageSex: '67Y / F',
          bloodGroup: 'O-',
          icd10Code: 'I63.9',
          diagnosis: 'Acute Ischemic Middle Cerebral Artery Stroke',
          doctor: 'Dr. Anirudh Bose, DM Neuro',
          admittedOn: '27 Oct 2026',
          edd: '02 Nov 2026',
          payer: 'Star Health TPA',
          acuity: 'ICU_CRITICAL',
        },
      },
      {
        number: 'ICU Bed #3',
        roomType: 'Critical Ventilator Bay',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        critical: true,
        sanitizationCertId: 'UV-2026-303V',
        lastSanitizedAt: 'Today, 08:40 AM',
      },
      {
        number: 'ICU Bed #4',
        roomType: 'Critical Ventilator Bay',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        critical: true,
        sanitizationCertId: 'UV-2026-304A',
        lastSanitizedAt: '28 Oct, 04:10 AM',
        occupant: {
          name: 'Jagdish Prasad Mishra',
          uhid: 'UHID-2026-0919',
          ageSex: '61Y / M',
          bloodGroup: 'B+',
          icd10Code: 'E10.10',
          diagnosis: 'Diabetic Ketoacidosis (DKA) on Insulin Infusion',
          doctor: 'Dr. Rajesh Sharma, MD',
          admittedOn: '28 Oct 2026',
          edd: '31 Oct 2026',
          payer: 'ICICI Lombard TPA',
          acuity: 'ICU_CRITICAL',
        },
      },
      {
        number: 'ICU Bed #5',
        roomType: 'Critical Isolation Bay',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: true,
        critical: true,
        sanitizationCertId: 'UV-2026-305V',
        lastSanitizedAt: 'Today, 09:15 AM',
      },
      {
        number: 'ICU Bed #6',
        roomType: 'Critical Isolation Bay',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: true,
        critical: true,
        sanitizationCertId: 'UV-2026-306A',
        lastSanitizedAt: '28 Oct, 01:00 AM',
        occupant: {
          name: 'Gopal Krishna Nair',
          uhid: 'UHID-2026-0981',
          ageSex: '57Y / M',
          bloodGroup: 'AB+',
          icd10Code: 'J80',
          diagnosis: 'Acute Respiratory Distress Syndrome (ARDS)',
          doctor: 'Dr. Vikram Malhotra, MD',
          admittedOn: '28 Oct 2026',
          edd: '04 Nov 2026',
          payer: 'MediAssist TPA',
          acuity: 'ICU_CRITICAL',
        },
      },
    ],
  },
  {
    id: 'ICCU_CARDIAC',
    name: 'Floor 3: Cardiac & Coronary Care Unit (ICCU)',
    shortName: 'Cardiac ICCU Wing',
    wingCode: 'FL3-ICCU-B',
    floor: 'Floor 3 (Cath-Lab Wing)',
    category: 'ICCU',
    nursingStation: 'Cardiac Telemetry Desk (Ext. 2310)',
    dailyRate: 'Rs. 9,200/day',
    roomRentPerDay: 9200,
    nursingChargePerDay: 2500,
    doctorFeePerDay: 2200,
    equipmentChargePerDay: 2000,
    beds: [
      {
        number: 'ICCU Bed #311',
        roomType: 'Cardiac Telemetry Bay',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        critical: true,
        sanitizationCertId: 'UV-2026-311A',
        lastSanitizedAt: '28 Oct, 02:15 AM',
        occupant: {
          name: 'Subhash Chandra Saxena',
          uhid: 'UHID-2026-0964',
          ageSex: '63Y / M',
          bloodGroup: 'O+',
          icd10Code: 'I21.09',
          diagnosis: 'Acute Anterior Wall STEMI (Post-Primary PCI)',
          doctor: 'Dr. Priya Patel, MD, DM',
          admittedOn: '28 Oct 2026',
          edd: '01 Nov 2026',
          payer: 'HDFC ERGO TPA',
          acuity: 'ICU_CRITICAL',
        },
      },
      {
        number: 'ICCU Bed #312',
        roomType: 'Cardiac Telemetry Bay',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        critical: true,
        sanitizationCertId: 'UV-2026-312V',
        lastSanitizedAt: 'Today, 07:40 AM',
      },
      {
        number: 'ICCU Bed #313',
        roomType: 'Cardiac Telemetry Bay',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        critical: true,
        sanitizationCertId: 'UV-2026-313V',
        lastSanitizedAt: 'Today, 08:50 AM',
      },
      {
        number: 'ICCU Bed #314',
        roomType: 'Cardiac Pacing Bay',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        critical: true,
        sanitizationCertId: 'UV-2026-314A',
        lastSanitizedAt: '27 Oct, 08:20 PM',
        occupant: {
          name: 'Lakshmi Narayan Iyer',
          uhid: 'UHID-2026-0909',
          ageSex: '70Y / M',
          bloodGroup: 'A+',
          icd10Code: 'I48.91',
          diagnosis: 'Atrial Fibrillation with Rapid Ventricular Rate',
          doctor: 'Dr. Priya Patel, MD, DM',
          admittedOn: '27 Oct 2026',
          edd: '31 Oct 2026',
          payer: 'CGHS Panel',
          acuity: 'ICU_CRITICAL',
        },
      },
    ],
  },
  {
    id: 'HDU_ISOLATION',
    name: 'Floor 4: High Dependency & Isolation Unit (HDU)',
    shortName: 'HDU & Negative Pressure',
    wingCode: 'FL4-HDU-ISO',
    floor: 'Floor 4 (Isolation Wing)',
    category: 'HDU_ISOLATION',
    nursingStation: 'HDU Barrier Desk (Ext. 2402)',
    dailyRate: 'Rs. 6,500/day',
    roomRentPerDay: 6500,
    nursingChargePerDay: 1800,
    doctorFeePerDay: 1500,
    equipmentChargePerDay: 1400,
    beds: [
      {
        number: 'HDU #401',
        roomType: 'HEPA Airlock Room',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: true,
        sanitizationCertId: 'UV-2026-401V',
        lastSanitizedAt: 'Today, 08:10 AM',
      },
      {
        number: 'HDU #402',
        roomType: 'HEPA Airlock Room',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: true,
        sanitizationCertId: 'UV-2026-402A',
        lastSanitizedAt: '27 Oct, 03:00 PM',
        occupant: {
          name: 'Farhan Ahmed Siddiqui',
          uhid: 'UHID-2026-0888',
          ageSex: '46Y / M',
          bloodGroup: 'B+',
          icd10Code: 'J10.0',
          diagnosis: 'H1N1 Influenza Viral Pneumonitis (Airborne Iso)',
          doctor: 'Dr. Vikram Malhotra, MD',
          admittedOn: '27 Oct 2026',
          edd: '01 Nov 2026',
          payer: 'Star Health TPA',
          acuity: 'EMERGENCY',
        },
      },
      {
        number: 'HDU #403',
        roomType: 'Step-Down HDU Bay',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-403V',
        lastSanitizedAt: 'Today, 09:00 AM',
      },
      {
        number: 'HDU #404',
        roomType: 'Step-Down HDU Bay',
        status: 'SANITIZING',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: true,
        sanitizationCertId: 'UV-2026-404S',
        lastSanitizedAt: 'HEPA Filter Purge Active',
      },
    ],
  },
  {
    id: 'MATERNITY_NICU',
    name: 'Floor 4: Maternal, Labor & Neonatal Suite (LDRP)',
    shortName: 'Maternity & Perinatal Wing',
    wingCode: 'FL4-MAT-LDR',
    floor: 'Floor 4 (Perinatal Wing)',
    category: 'MATERNITY',
    nursingStation: 'Perinatal Station (Ext. 2415)',
    dailyRate: 'Rs. 5,200/day',
    roomRentPerDay: 5200,
    nursingChargePerDay: 1400,
    doctorFeePerDay: 1200,
    equipmentChargePerDay: 800,
    beds: [
      {
        number: 'LDRP #411',
        roomType: 'Maternity Recovery Suite',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-411A',
        lastSanitizedAt: '28 Oct, 05:30 AM',
        occupant: {
          name: 'Pooja Verma Kulkarni',
          uhid: 'UHID-2026-0975',
          ageSex: '29Y / F',
          bloodGroup: 'O+',
          icd10Code: 'O80',
          diagnosis: 'Full-Term Normal Delivery & Postnatal Care',
          doctor: 'Dr. Kavita Deshpande, MS OBG',
          admittedOn: '28 Oct 2026',
          edd: '31 Oct 2026',
          payer: 'ICICI Lombard TPA',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'LDRP #412',
        roomType: 'Maternity Recovery Suite',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-412V',
        lastSanitizedAt: 'Today, 08:25 AM',
      },
      {
        number: 'LDRP #413',
        roomType: 'Fetal Monitoring Suite',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-413V',
        lastSanitizedAt: 'Today, 09:10 AM',
      },
      {
        number: 'NICU Warmer #1',
        roomType: 'Neonatal Radiant Warmer',
        status: 'OCCUPIED',
        o2: true,
        suction: true,
        ventilator: true,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        critical: true,
        sanitizationCertId: 'UV-2026-414A',
        lastSanitizedAt: '28 Oct, 06:00 AM',
        occupant: {
          name: 'Baby of Ritu Sharma',
          uhid: 'UHID-2026-0985',
          ageSex: '3 Days / M',
          bloodGroup: 'A+',
          icd10Code: 'P59.9',
          diagnosis: 'Neonatal Hyperbilirubinemia on Phototherapy',
          doctor: 'Dr. Sneha Rao, MD Pediatrics',
          admittedOn: '28 Oct 2026',
          edd: '30 Oct 2026',
          payer: 'Self-Pay Private',
          acuity: 'ROUTINE',
        },
      },
    ],
  },
  {
    id: 'DAYCARE_OBSERVATION',
    name: 'Ground Floor: Daycare & Chemotherapy Unit',
    shortName: 'Daycare & Dialysis Unit',
    wingCode: 'GFL-DAY-BAY',
    floor: 'Ground Floor (Ambulatory)',
    category: 'DAYCARE',
    nursingStation: 'Daycare Infusion Desk (Ext. 2012)',
    dailyRate: 'Rs. 800/session',
    roomRentPerDay: 800,
    nursingChargePerDay: 300,
    doctorFeePerDay: 400,
    equipmentChargePerDay: 300,
    beds: [
      {
        number: 'Daycare Bed #1',
        roomType: 'Infusion Recliner Bay',
        status: 'VACANT',
        o2: true,
        suction: false,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-001V',
        lastSanitizedAt: 'Today, 08:00 AM',
      },
      {
        number: 'Daycare Bed #2',
        roomType: 'Infusion Recliner Bay',
        status: 'OCCUPIED',
        o2: true,
        suction: false,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-002A',
        lastSanitizedAt: 'Today, 07:30 AM',
        occupant: {
          name: 'Nirmala Devi Jain',
          uhid: 'UHID-2026-0991',
          ageSex: '56Y / F',
          bloodGroup: 'B+',
          icd10Code: 'D50.9',
          diagnosis: 'Parenteral Ferric Carboxymaltose Infusion',
          doctor: 'Dr. Rajesh Sharma, MD',
          admittedOn: 'Today, 09:00 AM',
          edd: 'Today, 05:00 PM',
          payer: 'Self-Pay Daycare',
          acuity: 'ROUTINE',
        },
      },
      {
        number: 'Daycare Bed #3',
        roomType: 'Hemodialysis Station',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-003V',
        lastSanitizedAt: 'Today, 08:45 AM',
      },
      {
        number: 'Daycare Bed #4',
        roomType: 'Hemodialysis Station',
        status: 'VACANT',
        o2: true,
        suction: true,
        ventilator: false,
        monitor: true,
        infusionPump: true,
        negativePressure: false,
        sanitizationCertId: 'UV-2026-004V',
        lastSanitizedAt: 'Today, 09:15 AM',
      },
    ],
  },
];

export const CONSULTING_DOCTORS = [
  { name: 'Dr. Rajesh Sharma, MD', specialty: 'Chief Consultant - Internal Medicine & Critical Care', rmo: 'Dr. Vivek Rathore, MBBS' },
  { name: 'Dr. Priya Patel, MD, DM', specialty: 'Senior Interventional Cardiologist', rmo: 'Dr. Rohan Deshmukh, MBBS' },
  { name: 'Dr. Vikram Malhotra, MD, FCCP', specialty: 'Pulmonology & Respiratory ICU Head', rmo: 'Dr. Ankita Nair, MBBS' },
  { name: 'Dr. Amit Verma, MS, FMAS', specialty: 'General, GI & Laparoscopic Surgery', rmo: 'Dr. Saurabh Tiwari, MBBS' },
  { name: 'Dr. Neha Kulkarni, MD, DNB', specialty: 'Nephrology, Dialysis & Renal Transplant', rmo: 'Dr. Vivek Rathore, MBBS' },
  { name: 'Dr. Anirudh Bose, MD, DM', specialty: 'Neurology & Stroke ICU Specialist', rmo: 'Dr. Rohan Deshmukh, MBBS' },
  { name: 'Dr. Kavita Deshpande, MS OBG', specialty: 'Obstetrics, High-Risk Pregnancy & Gynecology', rmo: 'Dr. Meera Joshi, MBBS' },
  { name: 'Dr. Sneha Rao, MD, IAP', specialty: 'Pediatrics & Level-III Neonatology (NICU)', rmo: 'Dr. Meera Joshi, MBBS' },
  { name: 'Dr. Siddharth Singhania, MS', specialty: 'Orthopedics, Joint Replacement & Trauma', rmo: 'Dr. Saurabh Tiwari, MBBS' },
];

export const ICD10_CLINICAL_CATALOG = [
  { code: 'J44.1', title: 'Chronic Obstructive Pulmonary Disease (COPD) with Acute Exacerbation', defaultNotes: 'Continuous SpO2 monitoring, nebulization Q6H, IV Methylprednisolone & empirical antibiotics.', defaultLos: 4 },
  { code: 'I21.9', title: 'Acute Myocardial Infarction / Acute Coronary Syndrome (ACS)', defaultNotes: 'Continuous 12-lead cardiac telemetry, serial Troponin-I, dual antiplatelet & heparin protocol.', defaultLos: 5 },
  { code: 'A90', title: 'Dengue Hemorrhagic Fever with Thrombocytopenia', defaultNotes: 'Strict hourly isotropic IV fluid titration, Q12H Platelet & Hematocrit (PCV) monitoring.', defaultLos: 4 },
  { code: 'J18.9', title: 'Severe Community-Acquired Lobar Pneumonia', defaultNotes: 'Supplemental O2 titration for SpO2 >94%, IV Beta-Lactam + Macrolide, Chest X-Ray & CRP tracking.', defaultLos: 5 },
  { code: 'N18.5', title: 'Chronic Kidney Disease Stage 5 / Uremic Overload', defaultNotes: 'Strict fluid restriction (<1000 mL/day), renal electrolyte panel Q12H, nephrology dialysis prep.', defaultLos: 4 },
  { code: 'E11.65', title: 'Uncontrolled Type 2 Diabetes Mellitus with Hyperglycemia / Ketosis', defaultNotes: 'Basal-bolus insulin sliding scale, Q2H capillary blood glucose, serum electrolytes & ketone check.', defaultLos: 3 },
  { code: 'K80.20', title: 'Acute Cholecystitis / Post-Laparoscopic Cholecystectomy Care', defaultNotes: 'Post-op NPO for 6 hours, IV analgesia, surgical drain output monitoring, LFT review.', defaultLos: 3 },
  { code: 'A41.9', title: 'Sepsis / Systemic Inflammatory Response Syndrome (SIRS)', defaultNotes: 'Hour-1 Sepsis Bundle: Paired blood cultures, serum lactate, broad-spectrum carbapenem & vasopressor standby.', defaultLos: 6 },
  { code: 'I50.9', title: 'Acute Decompensated Heart Failure (ADHF)', defaultNotes: 'IV loop diuretic protocol, propped-up position, strict hourly urine output & NT-proBNP monitoring.', defaultLos: 5 },
  { code: 'N39.0', title: 'Complicated Urinary Tract Infection / Acute Pyelonephritis', defaultNotes: 'Urine culture-guided parenteral antibiotic therapy, renal ultrasound & fever charting.', defaultLos: 3 },
  { code: 'O80', title: 'Maternal Perinatal Admission / Normal Delivery & Postnatal Care', defaultNotes: 'Partogram & fetal heart rate (CTG) monitoring, maternal vitals Q4H, postnatal lactation support.', defaultLos: 3 },
  { code: 'Z51.11', title: 'DaycareParenteral Chemotherapy / Targeted Biologic Infusion', defaultNotes: 'Pre-medication anti-emetic protocol, chemo port patency check, post-infusion observation.', defaultLos: 1 },
];

export const INITIAL_DIAGNOSTIC_PANELS = [
  'Complete Blood Count (CBC) + Differential',
  'Renal Function & Serum Electrolytes (Na/K/Cl)',
  'Liver Function Panel (LFT) + Bilirubin',
  '12-Lead Bedside ECG & Rhythm Strip',
  'Portable Digital Chest X-Ray (PA/AP)',
  'Arterial Blood Gas (ABG) + Lactate',
  'CRP / Procalcitonin Inflammatory Panel',
  'Coagulation Profile (PT/INR & aPTT)',
];

export default function BedAllocationModal({
  isOpen,
  onClose,
  patient,
  initialWard,
  initialBed,
  onAllocate,
}: BedAllocationModalProps) {
  const [wardsState, setWardsState] = useState<HospitalWardWing[]>(HOSPITAL_WARDS_MASTER);
  const [viewMode, setViewMode] = useState<'VISUAL_MATRIX' | 'CENSUS_TABLE'>('VISUAL_MATRIX');
  const [bedFilter, setBedFilter] = useState<'ALL' | 'VACANT' | 'OCCUPIED' | 'O2' | 'VENT' | 'ISOLATION'>('ALL');
  const [censusSearch, setCensusSearch] = useState('');

  const [selectedWardId, setSelectedWardId] = useState<string>(HOSPITAL_WARDS_MASTER[0].id);
  const [selectedBedNumber, setSelectedBedNumber] = useState<string>('');

  // Clinical Admission Orders
  const [selectedDoctor, setSelectedDoctor] = useState<string>(CONSULTING_DOCTORS[0].name);
  const [admissionCategory, setAdmissionCategory] = useState<
    'ROUTINE' | 'EMERGENCY' | 'ICU_CRITICAL' | 'POST_OP' | 'MATERNITY' | 'DAYCARE'
  >('ROUTINE');
  const [selectedIcd10Code, setSelectedIcd10Code] = useState<string>(ICD10_CLINICAL_CATALOG[0].code);
  const [clinicalNotes, setClinicalNotes] = useState<string>(ICD10_CLINICAL_CATALOG[0].defaultNotes);
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([
    'Complete Blood Count (CBC) + Differential',
    'Renal Function & Serum Electrolytes (Na/K/Cl)',
    '12-Lead Bedside ECG & Rhythm Strip',
  ]);
  const [estimatedLosDays, setEstimatedLosDays] = useState<number>(4);
  const [transferReason, setTransferReason] = useState<string>('Clinical Care Optimization / Ward Step-Down');

  // Nursing & Safety Protocols
  const [dietOrder, setDietOrder] = useState<string>('Diabetic & Low-Sodium Therapeutic Diet');
  const [vitalsFrequency, setVitalsFrequency] = useState<string>('Q4H Standard Ward Vitals & SpO2');
  const [ioCharting, setIoCharting] = useState<string>('Strict 8-Hourly Shift Intake/Output (I/O)');
  const [fallRiskProtocol, setFallRiskProtocol] = useState<string>('Moderate Risk (Morse 35) - Side Rails Up');
  const [bradenScore, setBradenScore] = useState<string>('Score 19 (Low Ulcer Risk - 2H Reposition)');
  const [isolationLevel, setIsolationLevel] = useState<string>('Standard Universal Precautions');
  const [allergyNotes, setAllergyNotes] = useState<string>('No Known Drug Allergies (NKDA)');
  const [mlcStatus, setMlcStatus] = useState<string>('Non-MLC Clinical Admission');

  // Financial, Tariff & TPA Pre-Auth
  const [payerCategory, setPayerCategory] = useState<string>('Cashless TPA / Corporate Insurance');
  const [tpaProvider, setTpaProvider] = useState<string>('Star Health & Allied Insurance TPA');
  const [policyOrPreAuthNo, setPolicyOrPreAuthNo] = useState<string>('PREAUTH-2026-88419');
  const [preAuthStatus, setPreAuthStatus] = useState<string>('Approved Cashless');
  const [approvedPreAuthLimit, setApprovedPreAuthLimit] = useState<number>(150000);
  const [advanceDepositPaid, setAdvanceDepositPaid] = useState<number>(10000);

  // A4 Print Modal Preview State
  const [isA4PreviewOpen, setIsA4PreviewOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const activeWard = useMemo(
    () => wardsState.find((w) => w.id === selectedWardId) || wardsState[0],
    [wardsState, selectedWardId]
  );

  const activeBedObj = useMemo(
    () => activeWard.beds.find((b) => b.number === selectedBedNumber) || activeWard.beds.find((b) => b.status === 'VACANT') || activeWard.beds[0],
    [activeWard, selectedBedNumber]
  );

  // Sync initial ward & bed when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let targetWard = wardsState[0];
    if (initialWard) {
      const found = wardsState.find(
        (w) =>
          w.name.toLowerCase().includes(initialWard.toLowerCase()) ||
          w.shortName.toLowerCase().includes(initialWard.toLowerCase())
      );
      if (found) targetWard = found;
    } else if (patient?.ward) {
      const found = wardsState.find(
        (w) =>
          w.name.toLowerCase().includes(patient.ward!.toLowerCase()) ||
          w.shortName.toLowerCase().includes(patient.ward!.toLowerCase())
      );
      if (found) targetWard = found;
    }
    setSelectedWardId(targetWard.id);

    if (initialBed) {
      setSelectedBedNumber(initialBed);
    } else {
      const firstVacant = targetWard.beds.find((b) => b.status === 'VACANT');
      setSelectedBedNumber(firstVacant ? firstVacant.number : targetWard.beds[0]?.number || '');
    }

    if (patient?.attendingDoctor) {
      setSelectedDoctor(patient.attendingDoctor);
    }
    if (patient?.allergies && patient.allergies.length > 0) {
      setAllergyNotes(`Allergy Alert: ${patient.allergies.join(', ')}`);
    } else {
      setAllergyNotes('No Known Drug Allergies (NKDA)');
    }
  }, [isOpen, initialWard, initialBed, patient]);

  // Hospital-wide Census Summary Metrics
  const hospitalMetrics = useMemo(() => {
    let total = 0;
    let vacant = 0;
    let occupied = 0;
    let sanitizing = 0;
    let reserved = 0;
    let o2Ready = 0;
    let ventReady = 0;
    let isolationReady = 0;
    wardsState.forEach((w) => {
      w.beds.forEach((b) => {
        total++;
        if (b.status === 'VACANT') vacant++;
        else if (b.status === 'OCCUPIED') occupied++;
        else if (b.status === 'SANITIZING') sanitizing++;
        else if (b.status === 'RESERVED') reserved++;
        if (b.o2) o2Ready++;
        if (b.ventilator) ventReady++;
        if (b.negativePressure) isolationReady++;
      });
    });
    return { total, vacant, occupied, sanitizing, reserved, o2Ready, ventReady, isolationReady };
  }, [wardsState]);

  const handleWardChange = (wardId: string) => {
    setSelectedWardId(wardId);
    const ward = wardsState.find((w) => w.id === wardId);
    if (ward) {
      const firstVacant = ward.beds.find((b) => b.status === 'VACANT');
      setSelectedBedNumber(firstVacant ? firstVacant.number : '');
      if (ward.category === 'ICU' || ward.category === 'ICCU') {
        setAdmissionCategory('ICU_CRITICAL');
        setVitalsFrequency('Q1H Continuous ICU Multipara Telemetry');
        setIoCharting('Strict Hourly Urine & I/O Charting');
        setFallRiskProtocol('High Fall Risk (Morse 55) - Bed Rails + Continuous Watch');
      } else if (ward.category === 'HDU_ISOLATION') {
        setAdmissionCategory('EMERGENCY');
        setVitalsFrequency('Q2H High-Dependency Vitals & SpO2');
        setIsolationLevel('Airborne & Contact HEPA Negative-Pressure Isolation');
      } else if (ward.category === 'DAYCARE') {
        setAdmissionCategory('DAYCARE');
        setEstimatedLosDays(1);
        setVitalsFrequency('Pre/Mid/Post Session Vitals & SpO2');
      } else if (ward.category === 'MATERNITY') {
        setAdmissionCategory('MATERNITY');
        setVitalsFrequency('Q4H Maternal Vitals + Fetal Heart (CTG)');
      } else {
        setAdmissionCategory('ROUTINE');
        setVitalsFrequency('Q4H Standard Ward Vitals & SpO2');
        setIsolationLevel('Standard Universal Precautions');
      }
    }
  };

  const handleIcd10Select = (code: string) => {
    setSelectedIcd10Code(code);
    const found = ICD10_CLINICAL_CATALOG.find((item) => item.code === code);
    if (found) {
      setClinicalNotes(found.defaultNotes);
      setEstimatedLosDays(found.defaultLos);
    }
  };

  const toggleInvestigation = (panel: string) => {
    setSelectedInvestigations((prev) =>
      prev.includes(panel) ? prev.filter((item) => item !== panel) : [...prev, panel]
    );
  };

  // Real-time action: Complete UV Sanitization on a SANITIZING/RESERVED bed
  const handleMarkBedSanitizedVacant = (wardId: string, bedNumber: string) => {
    setWardsState((prev) =>
      prev.map((w) => {
        if (w.id !== wardId) return w;
        return {
          ...w,
          beds: w.beds.map((b) =>
            b.number === bedNumber
              ? {
                  ...b,
                  status: 'VACANT',
                  lastSanitizedAt: 'Just Verified (UV-C Pass)',
                }
              : b
          ),
        };
      })
    );
    setSelectedWardId(wardId);
    setSelectedBedNumber(bedNumber);
  };

  // Real-time action: Release an occupied bed to Housekeeping / Vacant
  const handleReleaseOccupiedBed = (wardId: string, bedNumber: string) => {
    setWardsState((prev) =>
      prev.map((w) => {
        if (w.id !== wardId) return w;
        return {
          ...w,
          beds: w.beds.map((b) =>
            b.number === bedNumber
              ? {
                  ...b,
                  status: 'VACANT',
                  occupant: undefined,
                  lastSanitizedAt: 'Released & Sanitized Now',
                }
              : b
          ),
        };
      })
    );
    setSelectedWardId(wardId);
    setSelectedBedNumber(bedNumber);
  };

  const expectedDischargeDateStr = useMemo(() => {
    const dt = new Date();
    dt.setDate(dt.getDate() + Math.max(1, estimatedLosDays));
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [estimatedLosDays]);

  const dailyCompositeRate = useMemo(() => {
    return (
      activeWard.roomRentPerDay +
      activeWard.nursingChargePerDay +
      activeWard.doctorFeePerDay +
      activeWard.equipmentChargePerDay
    );
  }, [activeWard]);

  const estimatedTotalStayCost = useMemo(() => {
    return dailyCompositeRate * Math.max(1, estimatedLosDays);
  }, [dailyCompositeRate, estimatedLosDays]);

  const selectedDoctorObj = useMemo(
    () => CONSULTING_DOCTORS.find((d) => d.name === selectedDoctor) || CONSULTING_DOCTORS[0],
    [selectedDoctor]
  );

  const selectedIcd10Obj = useMemo(
    () => ICD10_CLINICAL_CATALOG.find((c) => c.code === selectedIcd10Code) || ICD10_CLINICAL_CATALOG[0],
    [selectedIcd10Code]
  );

  const isExistingIpdTransfer = Boolean(patient?.ward && patient?.bedNumber);

  // Build full structured IPD Admission Record for A4 Print & Parent State
  const currentAdmissionRecord: IpdAdmissionRecordData | null = useMemo(() => {
    if (!patient) return null;
    const numericSeed = (patient.uhid || '1001').replace(/D/g, '').slice(-4) || '1042';
    return {
      ipdAdmissionNo: `IPD-2026-${numericSeed}`,
      admissionTimestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      admissionCategory,
      isTransfer: isExistingIpdTransfer,
      previousWardBed: isExistingIpdTransfer ? `${patient.ward} (${patient.bedNumber})` : undefined,
      patient: {
        id: patient.id,
        uhid: patient.uhid,
        firstName: patient.firstName,
        middleName: patient.middleName,
        lastName: patient.lastName,
        gender: patient.gender,
        age: patient.age,
        dateOfBirth: patient.dateOfBirth,
        bloodGroup: patient.bloodGroup,
        phone: patient.phone,
        abhaNumber: patient.abhaNumber,
        address: patient.address,
        city: patient.city,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        allergies: patient.allergies,
      },
      ward: {
        id: activeWard.id,
        name: activeWard.name,
        floor: activeWard.floor,
        wingCode: activeWard.wingCode,
        nursingStation: activeWard.nursingStation,
        roomRentPerDay: activeWard.roomRentPerDay,
        nursingChargePerDay: activeWard.nursingChargePerDay,
        doctorFeePerDay: activeWard.doctorFeePerDay,
        equipmentChargePerDay: activeWard.equipmentChargePerDay,
      },
      bed: {
        number: selectedBedNumber || activeBedObj?.number || 'Bed #103',
        roomType: activeBedObj?.roomType || 'Standard Hospital Bay',
        o2Port: activeBedObj?.o2 ?? true,
        suctionPort: activeBedObj?.suction ?? true,
        ventilatorReady: activeBedObj?.ventilator ?? false,
        multiparaMonitor: activeBedObj?.monitor ?? true,
        infusionPump: activeBedObj?.infusionPump ?? true,
        negativePressure: activeBedObj?.negativePressure ?? false,
        sanitizationCertId: activeBedObj?.sanitizationCertId || 'UV-2026-PASS',
        lastSanitizedAt: activeBedObj?.lastSanitizedAt || 'Verified Today',
      },
      clinical: {
        attendingDoctor: selectedDoctorObj.name,
        consultantSpecialty: selectedDoctorObj.specialty,
        coAdmittingDoctor: selectedDoctorObj.rmo,
        icd10Code: selectedIcd10Obj.code,
        icd10Title: selectedIcd10Obj.title,
        clinicalNotes: isExistingIpdTransfer
          ? `[Transfer: ${transferReason}] ${clinicalNotes}`
          : clinicalNotes,
        initialInvestigations:
          selectedInvestigations.length > 0
            ? selectedInvestigations
            : ['Complete Blood Count (CBC)', 'Renal & Electrolyte Panel'],
        dietOrder,
        vitalsFrequency,
        ioCharting,
        fallRiskProtocol,
        bradenScore,
        isolationLevel,
        allergyNotes,
        mlcStatus,
        estimatedLosDays,
        expectedDischargeDate: expectedDischargeDateStr,
      },
      billing: {
        payerCategory,
        tpaProvider: payerCategory.includes('Self-Pay') ? 'Direct Private Self-Pay' : tpaProvider,
        policyOrPreAuthNo: payerCategory.includes('Self-Pay') ? 'DIRECT-CASH-IPD' : policyOrPreAuthNo,
        preAuthStatus: payerCategory.includes('Self-Pay') ? 'Advance Deposit Collected' : preAuthStatus,
        approvedPreAuthLimit: payerCategory.includes('Self-Pay') ? estimatedTotalStayCost : approvedPreAuthLimit,
        dailyCompositeRate,
        estimatedTotalStayCost,
        advanceDepositPaid,
        receiptReference: `RCPT-IPD-${numericSeed}`,
      },
    };
  }, [
    patient,
    admissionCategory,
    isExistingIpdTransfer,
    activeWard,
    selectedBedNumber,
    activeBedObj,
    selectedDoctorObj,
    selectedIcd10Obj,
    transferReason,
    clinicalNotes,
    selectedInvestigations,
    dietOrder,
    vitalsFrequency,
    ioCharting,
    fallRiskProtocol,
    bradenScore,
    isolationLevel,
    allergyNotes,
    mlcStatus,
    estimatedLosDays,
    expectedDischargeDateStr,
    payerCategory,
    tpaProvider,
    policyOrPreAuthNo,
    preAuthStatus,
    approvedPreAuthLimit,
    dailyCompositeRate,
    estimatedTotalStayCost,
    advanceDepositPaid,
  ]);

  // Filtered Beds for the selected ward or all wards in Census Table mode
  const filteredActiveWardBeds = useMemo(() => {
    return activeWard.beds.filter((b) => {
      if (bedFilter === 'VACANT' && b.status !== 'VACANT') return false;
      if (bedFilter === 'OCCUPIED' && b.status !== 'OCCUPIED') return false;
      if (bedFilter === 'O2' && !b.o2) return false;
      if (bedFilter === 'VENT' && !b.ventilator) return false;
      if (bedFilter === 'ISOLATION' && !b.negativePressure) return false;
      if (censusSearch.trim()) {
        const q = censusSearch.toLowerCase();
        const matchBed = b.number.toLowerCase().includes(q) || b.roomType.toLowerCase().includes(q);
        const matchOcc =
          b.occupant &&
          (b.occupant.name.toLowerCase().includes(q) ||
            b.occupant.uhid.toLowerCase().includes(q) ||
            b.occupant.diagnosis.toLowerCase().includes(q) ||
            b.occupant.icd10Code.toLowerCase().includes(q) ||
            b.occupant.doctor.toLowerCase().includes(q));
        return Boolean(matchBed || matchOcc);
      }
      return true;
    });
  }, [activeWard, bedFilter, censusSearch]);

  if (!isOpen || !patient) return null;

  const fullName = formatPatientFullName(patient as any);
  const clinicalAge = calculateClinicalAge(patient.dateOfBirth, patient.age);

  const handleConfirmAllocation = (openPrintSheetAfter = false) => {
    if (!selectedBedNumber) return;
    setSubmitting(true);
    try {
      queueAudio.playHospitalChime('CRYSTAL_BELL');
      const summaryNotes = `[${selectedIcd10Obj.code} ${selectedIcd10Obj.title}] ${clinicalNotes} | Diet: ${dietOrder} | Vitals: ${vitalsFrequency} | Payer: ${payerCategory}`;
      onAllocate(
        patient.id,
        activeWard.name,
        selectedBedNumber,
        selectedDoctor,
        admissionCategory,
        summaryNotes,
        currentAdmissionRecord || undefined
      );
      if (openPrintSheetAfter) {
        setIsA4PreviewOpen(true);
      } else {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
        <div className="relative w-full max-w-[1440px] rounded-2xl bg-white shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[95vh]">
          {/* 1. ENTERPRISE HOSPITAL HEADER BAR */}
          <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-700 text-white shadow-xs border border-sky-800">
                <Bed className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black text-slate-950 tracking-tight">
                    {isExistingIpdTransfer
                      ? 'Inpatient (IPD) Inter-Ward Bed Transfer & Clinical Handover'
                      : 'Allocate Inpatient (IPD) Bed & Hospital Admission Workbench'}
                  </h2>
                  <span className="rounded bg-sky-50 text-sky-800 font-bold text-[10px] px-2 py-0.5 border border-sky-200 uppercase tracking-wider">
                    {isExistingIpdTransfer ? 'HL7 ADT^A02 Transfer' : 'HL7 ADT^A01 Admission'}
                  </span>
                  <span className="rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 border border-emerald-200 uppercase">
                    NABH / ISO 15189 Standard
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Multi-Wing Hospital Bed Infrastructure &middot; ICD-10-CM Clinical Orders &middot; Nursing &amp; Fall-Risk Protocols &middot; Cashless TPA &amp; Tariff Calculator
                </p>
              </div>
            </div>

            {/* Right Header Controls: View Switcher + A4 Print Preview + Close */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('VISUAL_MATRIX')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'VISUAL_MATRIX'
                      ? 'bg-white text-sky-900 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Floor &amp; Bed Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('CENSUS_TABLE')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'CENSUS_TABLE'
                      ? 'bg-white text-sky-900 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span>10-Col Ward Census Table</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsA4PreviewOpen(true)}
                className="rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-xs px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-sky-700" />
                <span>A4 Case Sheet &amp; Wristband</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 2. HOSPITAL-WIDE LIVE CENSUS & BIOMEDICAL PORT TELEMETRY STRIP */}
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  Hospital Bed Capacity
                </span>
                <span className="text-xs font-black text-slate-900">
                  {hospitalMetrics.total} Beds (8 Wings)
                </span>
              </div>
              <Building2 className="h-4 w-4 text-slate-400" />
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-1.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Vacant &amp; Sanitized Ready
                </span>
                <span className="text-xs font-black text-emerald-900">
                  {hospitalMetrics.vacant} Beds Available
                </span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  Active IPD Occupancy
                </span>
                <span className="text-xs font-black text-slate-900">
                  {hospitalMetrics.occupied} Admitted ({Math.round((hospitalMetrics.occupied / hospitalMetrics.total) * 100)}%)
                </span>
              </div>
              <User className="h-4 w-4 text-sky-600" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  O2 &amp; Ventilator Ports
                </span>
                <span className="text-xs font-black text-sky-900">
                  {hospitalMetrics.o2Ready} O2 &middot; {hospitalMetrics.ventReady} Vent
                </span>
              </div>
              <Wind className="h-4 w-4 text-sky-600" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  HEPA Negative Pressure
                </span>
                <span className="text-xs font-black text-slate-900">
                  {hospitalMetrics.isolationReady} Isolation Bays
                </span>
              </div>
              <ShieldCheck className="h-4 w-4 text-teal-600" />
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-1.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-800 block">
                  UV Housekeeping / Reserved
                </span>
                <span className="text-xs font-black text-amber-950">
                  {hospitalMetrics.sanitizing} UV &middot; {hospitalMetrics.reserved} Hold
                </span>
              </div>
              <RefreshCw className="h-4 w-4 text-amber-600" />
            </div>
          </div>

          {/* 3. MAIN SCROLLABLE CLINICAL WORKBENCH BODY */}
          <div className="p-5 space-y-5 overflow-y-auto flex-1 bg-slate-50/40">
            {/* PATIENT CLINICAL SUMMARY & TRANSFER BANNER */}
            <div className="rounded-xl border border-slate-300 bg-white p-3.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-800 font-black text-base shrink-0">
                  {fullName.charAt(0) || 'P'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-950 text-sm">{fullName}</span>
                    <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                      {patient.uhid}
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {clinicalAge.formatted} / {patient.gender === 'FEMALE' ? 'Female' : 'Male'}
                    </span>
                    {patient.bloodGroup && (
                      <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        Blood: {patient.bloodGroup}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-600">
                      ABHA: <strong>{patient.abhaNumber || '91-4829-7310-8842'}</strong>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-600">
                    <span>
                      Triage Vitals:{' '}
                      <strong className="text-slate-900 font-mono">
                        BP {patient.vitals?.bp || '126/82'} mmHg &middot; SpO2 {patient.vitals?.spo2 || 97}% &middot; Pulse{' '}
                        {patient.vitals?.pulse || 78} bpm
                      </strong>
                    </span>
                    <span>&middot;</span>
                    <span className="text-rose-700 font-semibold">{allergyNotes}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-200">
                <div className="text-left lg:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Admission Location
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {patient.ward ? `${patient.ward} (${patient.bedNumber})` : 'OPD / Unassigned Outpatient'}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-slate-200 hidden lg:block" />
                <div className="rounded-lg border border-sky-200 bg-sky-50/70 px-3 py-1.5">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-sky-700 block">
                    Target Bed Assignment
                  </span>
                  <span className="text-xs font-mono font-black text-sky-950">
                    {activeWard.shortName} &rarr; {selectedBedNumber || 'Select Bed'}
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 1: 8-WING HOSPITAL FLOOR & CARE WARD SELECTOR */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-sky-700" />
                  <span>1. Select Hospital Wing, Floor &amp; Care Level (8 Specialized Hospital Wings)</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  Click any hospital wing below to inspect live bed slots, biomedical ports, and per-day tariff schedule
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {wardsState.map((w) => {
                  const isSelected = selectedWardId === w.id;
                  const vacantCount = w.beds.filter((b) => b.status === 'VACANT').length;
                  const occupiedCount = w.beds.filter((b) => b.status === 'OCCUPIED').length;
                  const ventCount = w.beds.filter((b) => b.ventilator).length;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleWardChange(w.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {w.wingCode}
                          </span>
                          <span className="font-mono text-xs font-black text-slate-900">
                            {w.dailyRate}
                          </span>
                        </div>
                        <p className={`mt-1.5 text-xs font-black leading-snug ${isSelected ? 'text-sky-950' : 'text-slate-900'}`}>
                          {w.name}
                        </p>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          {w.floor} &middot; {w.nursingStation}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10.5px]">
                        <span className={`font-black ${vacantCount > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {vacantCount} Vacant / {w.beds.length} Total
                        </span>
                        <span className="font-semibold text-slate-500">
                          {occupiedCount} Occ {ventCount > 0 ? ` ${ventCount} Vent` : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: BED INFRASTRUCTURE MATRIX OR 10-COLUMN WARD CENSUS TABLE */}
            <div className="rounded-xl border border-slate-300 bg-white p-4 space-y-3.5 shadow-2xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      2. {activeWard.name} &mdash; Bed Infrastructure &amp; Occupancy Matrix
                    </h3>
                    <span className="rounded bg-slate-100 border border-slate-300 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                      {activeWard.nursingStation}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select any <strong className="text-emerald-700">VACANT READY</strong> bed slot to assign, or complete UV sanitization / release an existing slot.
                  </p>
                </div>

                {/* Biomedical & Status Filter Bar */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {([
                    { id: 'ALL', label: `All (${activeWard.beds.length})` },
                    { id: 'VACANT', label: `Vacant Ready (${activeWard.beds.filter((b) => b.status === 'VACANT').length})` },
                    { id: 'OCCUPIED', label: `Occupied (${activeWard.beds.filter((b) => b.status === 'OCCUPIED').length})` },
                    { id: 'O2', label: 'O2 Piped Port' },
                    { id: 'VENT', label: 'Ventilator Ready' },
                    { id: 'ISOLATION', label: 'Negative Pressure' },
                  ] as const).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBedFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        bedFilter === f.id
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  <div className="relative ml-1">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={censusSearch}
                      onChange={(e) => setCensusSearch(e.target.value)}
                      placeholder="Filter bed, patient, ICD-10..."
                      className="rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none w-44"
                    />
                  </div>
                </div>
              </div>

              {viewMode === 'VISUAL_MATRIX' ? (
                /* VISUAL INTERACTIVE BED CARDS */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {filteredActiveWardBeds.map((b) => {
                    const isVacant = b.status === 'VACANT';
                    const isOccupied = b.status === 'OCCUPIED';
                    const isSanitizing = b.status === 'SANITIZING' || b.status === 'RESERVED';
                    const isSelected = selectedBedNumber === b.number;

                    return (
                      <div
                        key={b.number}
                        onClick={() => {
                          if (isVacant) setSelectedBedNumber(b.number);
                        }}
                        className={`rounded-xl border p-3 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-2 border-sky-600 bg-sky-50/60 shadow-sm cursor-pointer'
                            : isVacant
                            ? 'border-emerald-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer'
                            : isSanitizing
                            ? 'border-amber-300 bg-amber-50/30'
                            : 'border-slate-200 bg-slate-50/80'
                        }`}
                      >
                        <div>
                          {/* Top Row: Bed Number + Status Badge */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-xs font-black text-slate-950">{b.number}</span>
                            {isSelected ? (
                              <span className="rounded bg-sky-700 text-white px-1.5 py-0.5 text-[9px] font-black uppercase flex items-center gap-0.5">
                                <Check className="h-2.5 w-2.5" /> Selected
                              </span>
                            ) : isVacant ? (
                              <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 text-[9px] font-black uppercase">
                                Vacant Ready
                              </span>
                            ) : isSanitizing ? (
                              <span className="rounded bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 text-[9px] font-black uppercase">
                                {b.status}
                              </span>
                            ) : (
                              <span className="rounded bg-slate-200 text-slate-700 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                                Occupied
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{b.roomType}</p>

                          {/* Biomedical Equipment Badges */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {b.o2 && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                O2
                              </span>
                            )}
                            {b.suction && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                VAC
                              </span>
                            )}
                            {b.monitor && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                MON
                              </span>
                            )}
                            {b.ventilator && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                VENT
                              </span>
                            )}
                            {b.negativePressure && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                NEG-P
                              </span>
                            )}
                          </div>

                          {/* Occupant or Sanitization Info */}
                          {isOccupied && b.occupant ? (
                            <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-0.5 text-[10px]">
                              <p className="font-bold text-slate-900 truncate">{b.occupant.name}</p>
                              <p className="font-mono text-[9.5px] text-slate-500">
                                {b.occupant.uhid} &middot; {b.occupant.ageSex}
                              </p>
                              <p className="text-[9.5px] text-slate-700 font-medium truncate">
                                <span className="font-mono font-bold text-sky-800">{b.occupant.icd10Code}</span>{' '}
                                {b.occupant.diagnosis}
                              </p>
                              <p className="text-[9px] text-slate-500 truncate">EDD: {b.occupant.edd}</p>
                            </div>
                          ) : (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[9.5px] text-slate-500">
                              <span className="font-mono block text-slate-600">{b.sanitizationCertId}</span>
                              <span>{b.lastSanitizedAt}</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Card Action */}
                        <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                          {isVacant ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBedNumber(b.number);
                              }}
                              className={`w-full rounded-lg py-1 text-[10.5px] font-bold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-700 text-white'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}
                            >
                              {isSelected ? 'Selected for Admission' : 'Select Vacant Bed'}
                            </button>
                          ) : isSanitizing ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkBedSanitizedVacant(activeWard.id, b.number);
                              }}
                              className="w-full rounded-lg py-1 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 cursor-pointer"
                            >
                              Mark UV Sanitized &amp; Ready
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReleaseOccupiedBed(activeWard.id, b.number);
                              }}
                              className="w-full rounded-lg py-1 text-[10px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer"
                            >
                              Discharge / Vacate Slot
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* 10-COLUMN ENTERPRISE WARD CENSUS & BIOMEDICAL TABLE */
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <th className="py-2.5 px-3">1. Bed &amp; Bay</th>
                        <th className="py-2.5 px-3">2. Status &amp; UV Cert</th>
                        <th className="py-2.5 px-3">3. Biomedical Ports</th>
                        <th className="py-2.5 px-3">4. Current Occupant / UHID</th>
                        <th className="py-2.5 px-3">5. Attending Consultant</th>
                        <th className="py-2.5 px-3">6. ICD-10 Diagnosis</th>
                        <th className="py-2.5 px-3">7. Admitted On</th>
                        <th className="py-2.5 px-3">8. Expected Discharge</th>
                        <th className="py-2.5 px-3">9. Tariff &amp; Payer</th>
                        <th className="py-2.5 px-3 text-right">10. Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredActiveWardBeds.map((b) => {
                        const isVacant = b.status === 'VACANT';
                        const isSelected = selectedBedNumber === b.number;
                        return (
                          <tr
                            key={b.number}
                            className={
                              isSelected
                                ? 'bg-sky-50/80'
                                : isVacant
                                ? 'bg-white hover:bg-emerald-50/20'
                                : 'bg-slate-50/50'
                            }
                          >
                            <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                              <div>{b.number}</div>
                              <div className="text-[10px] font-sans font-medium text-slate-500">{b.roomType}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-[9.5px] font-black uppercase ${
                                  isVacant
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : b.status === 'OCCUPIED'
                                    ? 'bg-slate-200 text-slate-800'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {b.status}
                              </span>
                              <div className="text-[9.5px] font-mono text-slate-500 mt-0.5">{b.sanitizationCertId}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1">
                                {b.o2 && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-50 text-sky-800 border border-sky-200">O2</span>}
                                {b.suction && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">VAC</span>}
                                {b.monitor && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">MON</span>}
                                {b.ventilator && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200">VENT</span>}
                                {b.negativePressure && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200">NEG-P</span>}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              {b.occupant ? (
                                <div>
                                  <div className="font-bold text-slate-900">{b.occupant.name}</div>
                                  <div className="font-mono text-[10px] text-slate-500">
                                    {b.occupant.uhid} &middot; {b.occupant.ageSex} &middot; {b.occupant.bloodGroup}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-emerald-700 font-semibold text-[11px]">Unoccupied &mdash; Ready for Admission</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] font-semibold text-slate-800">
                              {b.occupant ? b.occupant.doctor : activeWard.nursingStation}
                            </td>
                            <td className="py-2.5 px-3">
                              {b.occupant ? (
                                <div>
                                  <span className="font-mono text-[10px] font-bold bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded text-sky-900 mr-1">
                                    {b.occupant.icd10Code}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-800">{b.occupant.diagnosis}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">&mdash;</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-700">
                              {b.occupant ? b.occupant.admittedOn : b.lastSanitizedAt}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] font-semibold text-slate-800">
                              {b.occupant ? b.occupant.edd : 'Immediate'}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-bold text-slate-900">{activeWard.dailyRate}</div>
                              <div className="text-[10px] text-slate-500">{b.occupant ? b.occupant.payer : 'All TPA Eligible'}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isVacant ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedBedNumber(b.number)}
                                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                                    isSelected
                                      ? 'bg-sky-700 text-white'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Select Bed'}
                                </button>
                              ) : b.status === 'OCCUPIED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleReleaseOccupiedBed(activeWard.id, b.number)}
                                  className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 cursor-pointer"
                                >
                                  Vacate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMarkBedSanitizedVacant(activeWard.id, b.number)}
                                  className="rounded-lg border border-amber-300 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 text-[10.5px] font-bold text-amber-950 cursor-pointer"
                                >
                                  Mark Ready
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* STEP 3: 3-COLUMN ENTERPRISE CLINICAL, NURSING & FINANCIAL ADMISSION WORKBENCH */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* COLUMN 1: ADMITTING CONSULTANTS, ICD-10 DIAGNOSIS & STAT LAB ORDERS */}
              <div className="rounded-xl border border-slate-300 bg-white p-4 space-y-3.5 shadow-2xs">
                <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-sky-700" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      3A. Clinical Admission &amp; ICD-10 Orders
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                    Medical Orders
                  </span>
                </div>

                {isExistingIpdTransfer && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-2.5 space-y-1">
                    <label className="text-[10px] font-black uppercase text-amber-900 block">
                      Inter-Ward Bed Transfer Reason (HL7 ADT^A02)
                    </label>
                    <select
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    >
                      <option value="Clinical Step-Down from ICU to General/Private Ward">
                        Clinical Step-Down from ICU to General/Private Ward
                      </option>
                      <option value="Acute Clinical Escalation to ICU / Critical Care">
                        Acute Clinical Escalation to ICU / Critical Care
                      </option>
                      <option value="Infection Control / HEPA Negative-Pressure Isolation">
                        Infection Control / HEPA Negative-Pressure Isolation
                      </option>
                      <option value="Patient / Family Room Category Upgrade Request">
                        Patient / Family Room Category Upgrade Request
                      </option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Admission Acuity Category
                    </label>
                    <select
                      value={admissionCategory}
                      onChange={(e) => setAdmissionCategory(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                    >
                      <option value="ROUTINE">Routine Elective Admission</option>
                      <option value="EMERGENCY">Emergency / Casualty STAT</option>
                      <option value="ICU_CRITICAL">ICU Direct Critical Care</option>
                      <option value="POST_OP">Post-Operative Recovery</option>
                      <option value="MATERNITY">Maternity &amp; Perinatal Care</option>
                      <option value="DAYCARE">Daycare Chemo / Dialysis</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Est. Stay (LOS) &amp; EDD
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={estimatedLosDays}
                        onChange={(e) => setEstimatedLosDays(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                      />
                      <span className="text-[11px] font-semibold text-slate-600">
                        Days &rarr; <strong className="text-slate-900">{expectedDischargeDateStr}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Primary Admitting Consultant &amp; Specialty Unit
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                  >
                    {CONSULTING_DOCTORS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} - {d.specialty}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500">
                    Assigned Duty RMO: <strong className="text-slate-700">{selectedDoctorObj.rmo}</strong> &middot;{' '}
                    {activeWard.nursingStation}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Primary Admitting Diagnosis (ICD-10-CM Standard)
                  </label>
                  <select
                    value={selectedIcd10Code}
                    onChange={(e) => handleIcd10Select(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                  >
                    {ICD10_CLINICAL_CATALOG.map((item) => (
                      <option key={item.code} value={item.code}>
                        [{item.code}] {item.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Admitting Clinical Indication &amp; Treatment Plan
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Enter admitting clinical findings, IV fluid rates, and medication orders..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block">
                    Admission STAT Diagnostic Requisitions (Auto-Ordered to LIS)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {INITIAL_DIAGNOSTIC_PANELS.slice(0, 6).map((panel) => {
                      const checked = selectedInvestigations.includes(panel);
                      return (
                        <button
                          key={panel}
                          type="button"
                          onClick={() => toggleInvestigation(panel)}
                          className={`px-2 py-1 rounded border text-left text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            checked
                              ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className={`h-3 w-3 rounded flex items-center justify-center border ${
                              checked ? 'bg-sky-700 border-sky-700 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {checked && <Check className="h-2 w-2" />}
                          </span>
                          <span className="truncate">{panel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* COLUMN 2: MANDATORY NURSING CARE, DIET, FALL-RISK & ISOLATION PROTOCOLS */}
              <div className="rounded-xl border border-slate-300 bg-white p-4 space-y-3.5 shadow-2xs">
                <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-teal-700" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      3B. Nursing, Diet &amp; Safety Protocols
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    NABH Nursing Care
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Therapeutic Hospital Diet Regimen
                  </label>
                  <select
                    value={dietOrder}
                    onChange={(e) => setDietOrder(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                  >
                    <option value="Diabetic & Low-Sodium Therapeutic Diet">Diabetic &amp; Low-Sodium Therapeutic Diet</option>
                    <option value="Normal Balanced Hospital Diet (2000 kcal)">Normal Balanced Hospital Diet (2000 kcal)</option>
                    <option value="Renal Low-Potassium & Low-Sodium Diet">Renal Low-Potassium &amp; Low-Sodium Diet</option>
                    <option value="Cardiac Low-Lipid / Salt-Restricted Diet">Cardiac Low-Lipid / Salt-Restricted Diet</option>
                    <option value="Soft Mechanical / Post-Surgical Bland Diet">Soft Mechanical / Post-Surgical Bland Diet</option>
                    <option value="Clear Liquid Hydration Regimen">Clear Liquid Hydration Regimen</option>
                    <option value="NPO (Nil Per Os / Fasting for Surgery/Procedure)">NPO (Nil Per Os / Fasting for Surgery)</option>
                    <option value="Ryles Tube Enteral Nutrition (150 mL Q3H)">Ryles Tube Enteral Nutrition (150 mL Q3H)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Vital Signs &amp; SpO2 Frequency
                    </label>
                    <select
                      value={vitalsFrequency}
                      onChange={(e) => setVitalsFrequency(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                    >
                      <option value="Q1H Continuous ICU Multipara Telemetry">Q1H Continuous ICU Telemetry</option>
                      <option value="Q2H High-Dependency Vitals & SpO2">Q2H High-Dependency Vitals</option>
                      <option value="Q4H Standard Ward Vitals & SpO2">Q4H Standard Ward Vitals</option>
                      <option value="Q6H Stable Recovery Vitals">Q6H Stable Recovery Vitals</option>
                      <option value="Pre/Mid/Post Session Vitals & SpO2">Daycare Session Vitals</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Fluid Intake / Output (I/O)
                    </label>
                    <select
                      value={ioCharting}
                      onChange={(e) => setIoCharting(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                    >
                      <option value="Strict Hourly Urine & I/O Charting">Strict Hourly Urine &amp; I/O</option>
                      <option value="Strict 8-Hourly Shift Intake/Output (I/O)">Strict 8-Hourly Shift I/O</option>
                      <option value="Fluid Restriction (<1200 mL/24h) + Daily Weight">Fluid Restriction (&lt;1200 mL/24h)</option>
                      <option value="Standard Oral Hydration Recording">Standard Oral Hydration</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Morse Fall-Risk Assessment &amp; Mobility Protocol
                  </label>
                  <select
                    value={fallRiskProtocol}
                    onChange={(e) => setFallRiskProtocol(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                  >
                    <option value="Low Fall Risk (Morse <25) - Independent Mobility">Low Fall Risk (Morse &lt;25) - Independent</option>
                    <option value="Moderate Risk (Morse 35) - Side Rails Up">Moderate Risk (Morse 35) - Side Rails Up</option>
                    <option value="High Fall Risk (Morse 55) - Bed Rails + Continuous Watch">High Fall Risk (Morse &ge;45) - Yellow Band + Rails</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Infection Control &amp; Isolation
                    </label>
                    <select
                      value={isolationLevel}
                      onChange={(e) => setIsolationLevel(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                    >
                      <option value="Standard Universal Precautions">Standard Universal Precautions</option>
                      <option value="Contact Isolation (Gloves & Barrier Gown)">Contact Isolation (Barrier Gown)</option>
                      <option value="Droplet Precautions (N95 / Mask Mandatory)">Droplet Precautions (N95 Mask)</option>
                      <option value="Airborne & Contact HEPA Negative-Pressure Isolation">Airborne HEPA Negative Pressure</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Medico-Legal (MLC) Category
                    </label>
                    <select
                      value={mlcStatus}
                      onChange={(e) => setMlcStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                    >
                      <option value="Non-MLC Clinical Admission">Non-MLC Clinical Admission</option>
                      <option value="MLC Registered (Police Intimation Sent)">MLC Registered (Police Intimation)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Known Drug / Food Allergy &amp; Adverse Reaction Banner
                  </label>
                  <input
                    type="text"
                    value={allergyNotes}
                    onChange={(e) => setAllergyNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-800 focus:border-sky-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* COLUMN 3: ROOM TARIFF BREAKDOWN, TPA CASHLESS PRE-AUTH & DEPOSIT CALCULATOR */}
              <div className="rounded-xl border border-slate-300 bg-white p-4 space-y-3.5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-700" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        3C. Tariff, TPA Pre-Auth &amp; Deposit
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      IPD Billing Desk
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Financial Payer &amp; Billing Category
                    </label>
                    <select
                      value={payerCategory}
                      onChange={(e) => setPayerCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                    >
                      <option value="Cashless TPA / Corporate Insurance">Cashless TPA / Corporate Insurance</option>
                      <option value="Self-Pay / Direct Private Tariff">Self-Pay / Direct Private Tariff</option>
                      <option value="PM-JAY / Ayushman Bharat National Scheme">PM-JAY / Ayushman Bharat Scheme</option>
                      <option value="CGHS / ECHS Central Government Panel">CGHS / ECHS Government Panel</option>
                    </select>
                  </div>

                  {!payerCategory.includes('Self-Pay') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          TPA / Insurance Provider
                        </label>
                        <select
                          value={tpaProvider}
                          onChange={(e) => setTpaProvider(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900"
                        >
                          <option value="Star Health & Allied Insurance TPA">Star Health &amp; Allied TPA</option>
                          <option value="ICICI Lombard Health Care">ICICI Lombard Health Care</option>
                          <option value="MediAssist Healthcare TPA">MediAssist Healthcare TPA</option>
                          <option value="HDFC ERGO Health Insurance">HDFC ERGO Health Insurance</option>
                          <option value="Niva Bupa Health Insurance">Niva Bupa Health Insurance</option>
                          <option value="PM-JAY National Health Authority">PM-JAY National Health Auth</option>
                          <option value="CGHS / ECHS Central Desk">CGHS / ECHS Central Desk</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Pre-Auth / Policy Number
                        </label>
                        <input
                          type="text"
                          value={policyOrPreAuthNo}
                          onChange={(e) => setPolicyOrPreAuthNo(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* Daily Tariff Breakdown Box */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                      <span>Per-Day Composite Tariff ({activeWard.wingCode})</span>
                      <span>Rate / Day</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>1. Ward Room / Bed Charge:</span>
                      <span className="font-mono font-bold text-slate-900">
                        &#8377;{activeWard.roomRentPerDay.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>2. 24&times;7 Nursing &amp; Boarding Care:</span>
                      <span className="font-mono font-bold text-slate-900">
                        &#8377;{activeWard.nursingChargePerDay.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>3. Admitting Consultant Daily Rounds:</span>
                      <span className="font-mono font-bold text-slate-900">
                        &#8377;{activeWard.doctorFeePerDay.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>4. Biomedical Ports (O2 / Monitor):</span>
                      <span className="font-mono font-bold text-slate-900">
                        &#8377;{activeWard.equipmentChargePerDay.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-black text-slate-950">
                      <span>Daily Composite Rate:</span>
                      <span className="font-mono text-sm text-sky-900">
                        &#8377;{dailyCompositeRate.toLocaleString('en-IN')} / day
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deposit & Estimate Footer Box */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Est. {estimatedLosDays}-Day Stay Total:
                    </span>
                    <span className="font-mono text-sm font-black text-slate-950">
                      &#8377;{estimatedTotalStayCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-emerald-950">
                      Admission Advance Deposit (&#8377;):
                    </label>
                    <input
                      type="number"
                      step={500}
                      min={0}
                      value={advanceDepositPaid}
                      onChange={(e) => setAdvanceDepositPaid(Math.max(0, Number(e.target.value) || 0))}
                      className="w-28 rounded-lg border border-emerald-400 bg-white px-2.5 py-1 text-right font-mono text-xs font-black text-emerald-950"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. MODAL FOOTER BAR */}
          <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Selected Slot:
              </span>
              <span className="font-mono font-black text-sky-900 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                {activeWard.shortName} &mdash; {selectedBedNumber || 'None'}
              </span>
              <span className="hidden sm:inline text-slate-400">&middot;</span>
              <span className="hidden sm:inline font-medium">
                Consultant: <strong className="text-slate-900">{selectedDoctor}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!selectedBedNumber || submitting}
                onClick={() => handleConfirmAllocation(true)}
                className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !selectedBedNumber || submitting
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-950'
                }`}
              >
                <Printer className="h-4 w-4 text-sky-700" />
                <span>Confirm &amp; Print A4 Admission Sheet</span>
              </button>

              <button
                type="button"
                disabled={!selectedBedNumber || submitting}
                onClick={() => handleConfirmAllocation(false)}
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                  !selectedBedNumber || submitting
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-sky-700 hover:bg-sky-800 active:scale-[0.99]'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {isExistingIpdTransfer
                    ? `Confirm Bed Transfer (${selectedBedNumber || 'Select'})`
                    : `Confirm Bed Allocation (${selectedBedNumber || 'Select'})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated A4 Printable IPD Admission Case Sheet & Wristband Modal */}
      <IpdAdmissionA4PrintModal
        isOpen={isA4PreviewOpen}
        onClose={() => setIsA4PreviewOpen(false)}
        record={currentAdmissionRecord}
      />
    </>
  );
}
