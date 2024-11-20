import {
  Button,
  Collapse,
  Form,
  List,
  Modal,
  Radio,
  Space,
  Upload,
  message,
  Switch,
  Input,
  Select,
  Checkbox,
  Image,
} from "antd";
import React, { useEffect, useState } from "react";
import { fetchData, postData, putData } from "../../../utilis/instance";
import { MenuItem, TextField } from "@mui/material";
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { setVehicleCondition } from "../../../Redux/action";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import TextArea from "antd/es/input/TextArea";
import PDFViewer from "../pdfViewer";
import { SuccessModal } from "./SmsModel";
import { ConfirmationModal } from "./SmsModel";
const { Panel } = Collapse;

const InspectionReport = ({ handleBack, handleNext }) => {
  const [form] = Form.useForm();
  const [CustomOrderform] = Form.useForm();
  const [mechanic, setMechanic] = useState("");
  const [listMechanic, setListMechanic] = useState([]);
  const [dataCheck, setDataCheck] = useState([]);
  const [inspectionData, setInspectionData] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [clickedImage, setClickedImage] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [addedCheckpoints, setAddedCheckpoints] = useState([]);
  const [filtered, setFiltered] = useState(addedCheckpoints);
  const [uploadedImages, setUploadedImages] = useState({});
  const [expandedItem, setExpandedItem] = useState(null);
  const [stat, setStat] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTab, setCurrenTab] = useState("CustomOrder");
  const [isTaxEnabled, setIsTaxEnabled] = useState(false);
  const [isTaxApplied, setIsTaxApplied] = useState("0");
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [rate, setRate] = useState(0);
  const [quantity] = useState("1");
  const [taxPercent, setTaxPercent] = useState("5");
  const [discount, setDiscount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [taxValue, setTaxValue] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [hsn, setHsn] = useState("");
  const [visibilityState, setVisibilityState] = useState({});
  const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [customOrder, setCustomOrder] = useState({
    orderName: "",
    quantity: "",
    rate: "",
  });
  const vehicleId = localStorage.getItem("VehicleID");
  const [servicesList, setServicesList] = useState([]);
  const [partList, setPartList] = useState([]);
  const [packagesList, setPackageList] = useState([]);
  const [error, setError] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const dispatch = useDispatch();
  const [servicesSearch, setServicesSearch] = useState("");
  const [packagesSearch, setPackagesSearch] = useState("");
  const [partsSearch, setPartsSearch] = useState("");
  const [addNotesModal, setAddNotesModal] = useState(false);
  const [addNotes, setAddNotes] = useState("");
  const [isConfirmationVisible, setConfirmationVisible] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    setFiltered(addedCheckpoints);
  }, [addedCheckpoints]);

  let serviceBookingId = localStorage.getItem("serviceBookingId");

  const updatedServices = async () => {
    console.log(addedCheckpoints, filtered);

    const payload = {
      serviceBookingId: serviceBookingId,
      services: addedCheckpoints,
    };

    console.log(payload);
    console.log(filtered);
    console.log(addedCheckpoints);

    try {
      const response = await postData(
        "/estimate/addInspectionServices",
        payload
      );
      console.log(response);
      if (response.responseCode === 200) {
        setPdfUrl(response?.inspectionURL);
        setIsPdfModalVisible(true);
      }
    } catch (error) {
      console.error("Error adding service:", error); // Log error for debugging
      message.error("Failed to Create Service");
    }
  };

  const handleContinue = async () => {
    setIsPdfModalVisible(false);
    setConfirmationVisible(true);
    // handleNext();
  };

  useEffect(() => {
    dispatch(
      setVehicleCondition({ filtered: filtered, mechanicName: mechanic })
    );
  }, [filtered, addedCheckpoints, mechanic]);

  const vehicleCondition = useSelector(
    (state) => state.formData.vehicleCondition
  );
  console.log(vehicleCondition);

  useEffect(() => {
    if (vehicleCondition?.filtered) {
      setFiltered(vehicleCondition?.filtered);
      setAddedCheckpoints(vehicleCondition?.filtered);
    }
    if (vehicleCondition?.mechanicName) {
      setMechanic(vehicleCondition?.mechanicName);
    }
  }, []);

  const onFinish2 = async () => {
    await fetchListInspectionDetails();

    const uploadedImages = fileList
      .filter((file) => file.url)
      .map((file, index) => ({
        image: file.url,
        alt: `Image ${index + 1}`,
      }));

    // Build the payload
    const dataCheck = {
      vehicleId: vehicleId,
      inspectionData: [], // Initialize as an array
      images: uploadedImages,
      mechanic: vehicleCondition?.mechanicName,
    };

    // Loop through `selectedStatus` to populate `inspectionData`
    if (selectedStatus) {
      for (const inspectionType in selectedStatus) {
        const inspections = selectedStatus[inspectionType];
        inspections.forEach((statusItem) => {
          // Push each status item as a separate entry in `inspectionData`
          dataCheck.inspectionData.push({
            _id: statusItem.id,
            image: statusItem.image || "",
            inspectionType: inspectionType,
            vehicleCondition: statusItem.status || 0,
            notes: "", // Add notes if required, or pass from another source
          });
        });
      }
    }

    console.log("Final Payload:", dataCheck); // Check payload structure

    try {
      const response = await postData("/v1/updateInspection", dataCheck);
      console.log("Response:", response.inspectionData);

      updatedServices();
      message.success("Vehicle Inspection Updated Successfully");
    } catch (error) {
      console.error("Error updating inspection:", error);
      message.error("Failed to Update Vehicle Inspection");
    }
  };

  const handlePdfCloseModal = () => {
    setIsPdfModalVisible(false);
  };

  const handleConfirm = () => {
    setConfirmationVisible(false);
    setSuccessVisible(true);
  };

  const handleSuccessOk = () => {
    setSuccessVisible(false);
  };

  // Example function to set selected service and status (depending on your UI logic)
  const handleServiceSelection = (service) => {
    setSelectedService(service); // Select service when the user clicks on it
    setIsModalVisible(true);
  };

  const handleStatusSelection = async (value, item) => {
    setStat(value);
    setSelectedStatus((prev) => {
      const updatedStatus = { ...prev };

      // Create or update the inspection array for the specific inspection type
      if (!updatedStatus[item.inspectionType]) {
        updatedStatus[item.inspectionType] = []; // Initialize if not present
      }

      // Update or add the status for the specific item
      const inspectionId = item._id;
      const statusIndex = updatedStatus[item.inspectionType].findIndex(
        (statusItem) => statusItem.id === inspectionId
      );

      if (statusIndex !== -1) {
        // Update existing status item
        updatedStatus[item.inspectionType][statusIndex] = {
          status: value, // Update the vehicle condition
          id: inspectionId,
          image: item.image || "",
        };
      } else {
        // Add new status item
        updatedStatus[item.inspectionType].push({
          status: value,
          id: inspectionId,
          image: item.image || "",
        });
      }

      // Construct the final payload
      const payload = {
        vehicleId: vehicleId,
        inspectionData: [],
        images: [],
        mechanic: mechanic,
      };

      // Add updated inspection data
      for (const inspectionType in updatedStatus) {
        const currentInspectionArray = updatedStatus[inspectionType];

        currentInspectionArray.forEach((statusItem) => {
          payload.inspectionData.push({
            vehicleCondition: statusItem.status || 0, // Use updated status
            _id: statusItem.id, // Use the unique ID
            image: statusItem.image || "", // Add image or empty string if not available
          });
        });
      }

      // Include non-updated items
      for (const inspectionType in inspectionData) {
        const existingItems = inspectionData[inspectionType];

        // Check if existingItems is an array
        if (Array.isArray(existingItems)) {
          existingItems.forEach((existingItem) => {
            const isUpdated = Object.values(updatedStatus)
              .flat()
              .some((statusItem) => statusItem.id === existingItem._id);
            if (!isUpdated) {
              // Only add if not updated
              payload.inspectionData.push({
                vehicleCondition: existingItem.vehicleCondition || 0, // Use existing condition
                _id: existingItem._id, // Use the unique ID
                image: existingItem.image || "", // Add image or empty string if not available
              });
            }
          });
        } else {
          console.warn(
            `Expected array but got ${typeof existingItems} for inspectionType ${inspectionType}`
          );
        }
      }

      setDataCheck(payload);

      return updatedStatus; // Return the updated state
    });
  };

  const handleAddServiceJob = async (values) => {
    console.log(values, "handleServiceJob Form Values");

    try {
      let servicesArray = [...addedCheckpoints];

      if (values && selectedStatus) {
        const customService = createService(values, null, "custom", true);
        console.log(customService);

        const isDuplicate = servicesArray.some((existingService) => {
          return (
            !customService.serviceId &&
            (existingService.serviceName === customService.serviceName ||
              existingService.partName === customService.serviceName ||
              existingService.packageName === customService.serviceName)
          );
        });

        if (isDuplicate) {
          message.error(
            `The custom service "${customService.serviceName}" is already selected. Please change the name.`
          );
        } else {
          servicesArray.push(customService);
        }
      }

      // Construct the payload with the updated `servicesArray`
      const payload = {
        vehicleId: vehicleId,
        services: servicesArray,
      };
      console.log(payload);
      // Send the API request
      // await putData("/updateInspection", payload);

      // Success message
      message.success("Vehicle service added successfully");

      // Update addedCheckpoints state
      console.log(servicesArray);

      setAddedCheckpoints(servicesArray);

      // Clear form fields (if using Ant Design form instance)
      CustomOrderform.resetFields();

      // Reset form-related states
      setIsTaxApplied("0");
      setIsDiscountApplied(false);
      setIsTaxEnabled(false);
      setSubtotal(0);
      setDiscount(0);
      setTotalAmount(0);
      setTaxValue(0);
      setDiscountValue(0);
      setRate(0);

      setIsModalVisible(false);
    } catch (error) {
      // Handle error
      message.error("Failed to add the service, please try again");
      console.error("API Error:", error);
    }
  };

  const handleAddServiceJob1 = async (values) => {
    try {
      let servicesArray = [...addedCheckpoints];

      // Add modified services from selectedServices if present
      console.log(servicesArray, selectedStatus);

      if (servicesArray.length > 0) {
        const modifiedServices = []; // Create an array for modified services

        servicesArray.forEach((service) => {
          // Check if the service type is not "custom"
          if (service.type !== "custom") {
            const newService = createService(null, service, "service"); // Generate modified service
            console.log(newService);
            modifiedServices.push(newService); // Add modified service to the new array
          }
        });

        // Now, combine the original services with the modified ones
        servicesArray = [...servicesArray, ...modifiedServices];
      }

      console.log(servicesArray);

      let excludedCustomServices = [];

      // Reduce function to filter services
      const uniqueServicesArray = servicesArray.reduce((acc, newService) => {
        // Check if the newService type is not "custom" and it has a serviceId
        if (newService.type !== "custom" && newService.serviceId) {
          // Add only services with a serviceId to the accumulator
          acc.push(newService);
        } else if (newService.type === "custom") {
          // If the service is of type "custom", add it to the excluded list
          excludedCustomServices.push(newService);
        }

        return acc; // Return the accumulated unique services
      }, []);

      // After the reduction, add excluded custom services to the uniqueServicesArray
      uniqueServicesArray.push(...excludedCustomServices);

      // Log the final unique services array
      console.log("Final Unique Services Array:", uniqueServicesArray);

      // Construct payload for the API call
      const payload = {
        vehicleId: vehicleId,
        services: uniqueServicesArray,
      };

      // Update addedCheckpoints with unique services
      setAddedCheckpoints(uniqueServicesArray);

      // Make the API call to update the inspection services
      // await putData("/updateInspection", payload);

      // Success message
      message.success("Vehicle service added successfully");

      // Clear form fields and fetch updated inspection list
      CustomOrderform.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to add the service, please try again");
      console.error("API Error:", error);
    }
  };

  const handleRemove = (index, item) => {
    setAddedCheckpoints((prevCheckpoints) =>
      prevCheckpoints.map((checkpoint) =>
        (checkpoint.serviceId && checkpoint.serviceId === item.serviceId) ||
        (!checkpoint.serviceId && checkpoint.serviceName === item.serviceName)
          ? { ...checkpoint, status: false }
          : checkpoint
      )
    );
  };

  const handleTabChange = (newValue) => {
    setCurrenTab(newValue);
  };

  const handleCheckboxChange = (e, service, type) => {
    const { checked } = e.target;
    console.log(type);

    setAddedCheckpoints((prevCheckpoints) => {
      // Create a modified service using the createService function
      const newService = createService(null, service, type);

      if (checked) {
        // Add the modified service with status: true or update it if it exists
        const updatedCheckpoints = prevCheckpoints.filter(
          (item) => item.serviceId !== newService.serviceId
        );
        return [...updatedCheckpoints, { ...newService, status: true }];
      } else {
        // If unchecked, set status: false or remove it from the list
        return prevCheckpoints.map((item) =>
          item.serviceId === newService.serviceId
            ? { ...item, status: false }
            : item
        );
      }
    });
  };

  const handleAddService = (values) => {
    let newService = {};

    if (selectedService && selectedStatus && values) {
      newService = {
        vehicleId: vehicleId, // Assuming you have the vehicleId
        services: [
          {
            serviceId: selectedService.serviceId || "", // Extracted from selected service
            addDescription: values.addDescription || "", // Additional description from form
            serviceName: values.service || selectedServices.serviceName, // Service name
            sac_hsn: values.sac_hsn || "0.00", // SAC/HSN from form or default
            subTotal: values.subTotal || "0.00", // SubTotal from form
            rate: values.rate || "0", // Rate from form
            tax: values.tax || "0", // Tax from form
            taxType: values.taxType || "0", // Tax type from form (0 or 1)
            discount: values.discount || "0", // Discount from form
            totalAmount: values.totalAmount || "0.00", // Total amount from form
            quantity: values.quantity || "1", // Quantity from form
            taxAmount: values.taxAmount || "0.00", // Tax amount (calculated or provided)
            discountAmount: values.discountAmount || "0.00", // Discount amount from form
            applyTaxStatus: values.applyTaxStatus || false, // Tax status from form
            discountStatus: values.discountStatus || false, // Discount status from form
            serviceType: values.serviceType || "", // Service type from form
            status: selectedStatus, // Selected status (red, green, etc.)
          },
        ],
      };
    } else {
      console.error("No service or status selected!");
      return; // Exit the function if no valid input
    }

    setAddedCheckpoints((prevCheckpoints) => [...prevCheckpoints, newService]);

    // Close modal
    setIsModalVisible(false);
  };
  // Modular function to create service
  const createService = (values, serve, type, isCustom = false) => {
    // If the service is custom
    if (values) {
      console.log("custome", values);
      return {
        serviceId: "", // Custom service has no serviceId
        addDescription: values.addDescription || "", // Additional description for custom service
        serviceName: values.service, // Default to "custom" for unnamed services
        sac_hsn: values.hsn || "0.00", // SAC/HSN default to "0.00"
        subTotal: values.subtotal || "100.00", // Default value for custom subtotal
        rate: values.rate || "100", // Default rate for custom service
        tax: values.taxPercent || "", // Tax may be empty for custom
        taxType: values.taxType || "1", // Tax type for custom
        taxAmount: values.taxValue || "0.00", // Default tax amount
        discountAmount: values.discountValue || "0.00", // Default discount amount
        discount: values.discountPercent || "", // Discount may be empty
        totalAmount: values.totalAmount, // Default total amount for custom
        quantity: values.quantity || "1", // Default quantity
        applyTaxStatus: values?.applyTax || false, // Custom service doesn't apply tax
        discountStatus: values?.applyDiscount || false, // No discount for custom by default
        serviceType: values.serviceType || "", // Optional service type
        status: true,
        type: type,
      };
    }

    if (serve) {
      console.log("No custom", serve);
      return {
        serviceId: serve?._id || "",
        addDescription: serve.addDescription || "",
        serviceName:
          serve?.serviceName || serve?.partName || serve?.packageName || "",
        sac_hsn: serve.sac_hsn || "0.00",
        subTotal: serve.subTotal || "0.00",
        rate: serve.rate || "0",
        tax: serve.tax || "",
        taxType: serve.taxType || "0",
        taxAmount: serve.taxAmount || "0.00", // Tax amount (calculated or provided)
        discount: serve.discount || "0", // Discount from form (can be empty)
        discountAmount: serve.discountAmount || "0.00", // Discount amount from form
        totalAmount: serve.totalAmount || "0.00", // Total amount from form
        quantity: serve.quantity || "1", // Quantity from form
        applyTaxStatus: serve.applyTaxStatus || false, // Tax status from form
        discountStatus: serve.discountStatus || false, // Discount status from form
        serviceType: serve.serviceType || "", // Service type from form (optional)
        status: true,
        type: type,
      };
    }

    return {};
  };

  const handleRateChange = (e) => {
    const newRate = e.target.value ? parseFloat(e.target.value) : 0;
    setRate(newRate);
    const subtotal = parseFloat((newRate * quantity).toFixed(2));
    setSubtotal(subtotal);
    form.setFieldValue("subtotal", subtotal);
  };

  const handleImageUpload = (e, itemId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImages((prev) => ({
          ...prev,
          [itemId]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVisibility = (itemId) => {
    setVisibilityState((prevState) => ({
      ...prevState,
      [itemId]: !prevState[itemId],
    }));
  };

  const fetchListInspectionDetails = async () => {
    const vehicleId = localStorage.getItem("VehicleID");
    const payload = {
      vehicleId: vehicleId,
    };

    try {
      const result = await postData("/v1/getInspectionDetails", payload);
      console.log(result);

      // Check if the response has data
      if (result?.responseCode === 200 && result?.data) {
        const inspectionData = result.data.flatMap((category) =>
          category.inspections.map((item) => ({
            _id: item._id,
            image: item.image,
            vehicleCondition: item.vehicleCondition,
          }))
        );

        setInspectionData(result.data);
        setDataCheck(inspectionData);
      } else {
        console.error("No inspection data available");
      }
    } catch (error) {
      console.error("Error fetching inspection details:", error);
    }
  };

  const ServicesList = async () => {
    try {
      const data = await fetchData("/new_list_Of_Services");
      setServicesList(data.serviceList);
    } catch (err) {
      setError(err.message);
    } finally {
      // setLoading(false);
    }
  };
  const PartList = async () => {
    try {
      const data = await fetchData("/listOf_new_Parts");
      setPartList(data.list);
    } catch (err) {
      // setError(err.message);
    } finally {
      // setLoading(false);
    }
  };

  const PackagesList = async () => {
    try {
      const data = await fetchData("/listOf_new_Packages");
      setPackageList(data.PackageList);
    } catch (err) {
      // setError(err.message);
    } finally {
      // setLoading(false);
    }
  };
  useEffect(() => {
    ServicesList();
    PartList();
    PackagesList();
  }, []);

  useEffect(() => {
    let newSubtotal = 0;
    let calculatedDiscount = 0;
    let amountAfterDiscount = 0;
    let calculatedTax = 0;
    let total = 0;

    const totalAmountWithoutAdjustments = parseFloat(
      (rate * quantity).toFixed(2)
    );
    console.log(
      typeof isTaxApplied,
      isTaxApplied,
      typeof isDiscountApplied,
      isDiscountApplied
    );

    if (!isTaxEnabled && !isDiscountApplied) {
      // No Tax, No Discount
      console.log("No tax and Discount scenerio");
      newSubtotal = totalAmountWithoutAdjustments;
      total = newSubtotal;
    } else if (isTaxEnabled && !isDiscountApplied) {
      // Only Tax Involved
      console.log("Tax is Enabled", isTaxEnabled, isTaxApplied);

      if (isTaxApplied === "1") {
        // Tax not included in total amount
        console.log(isTaxApplied, "1");

        newSubtotal = totalAmountWithoutAdjustments;
        calculatedTax = newSubtotal * (taxPercent / 100);
        total = newSubtotal + calculatedTax;
      } else {
        // Tax included in total amount
        console.log(isTaxApplied, "0");
        total = totalAmountWithoutAdjustments;
        newSubtotal = totalAmountWithoutAdjustments / (1 + taxPercent / 100);
        calculatedTax = newSubtotal * (taxPercent / 100);
      }
    } else if (!isTaxEnabled && isDiscountApplied) {
      // Only Discount Involved
      newSubtotal = totalAmountWithoutAdjustments;
      calculatedDiscount = newSubtotal * (discount / 100);
      total = newSubtotal - calculatedDiscount;
    } else {
      // Both Tax and Discount Involved
      console.log("Both Are involved", isTaxApplied);

      if (isTaxApplied === "0") {
        // Step 1: Calculate Subtotal with tax exclude
        newSubtotal = (rate * quantity) / (1 + taxPercent / 100);
        setSubtotal(newSubtotal.toFixed(2)); // Expected: 95.24

        // Step 2: Calculate Discount Value based on the subtotal
        calculatedDiscount = newSubtotal * (discount / 100); // Expected: 9.52
        setDiscountValue(calculatedDiscount.toFixed(2));

        // Step 3: Calculate Amount After Discount
        amountAfterDiscount = newSubtotal - calculatedDiscount; // Expected: 85.72

        // Step 4: Calculate Tax Value based on amount after discount
        calculatedTax = amountAfterDiscount * (taxPercent / 100); // Expected: 4.29
        setTaxValue(calculatedTax.toFixed(2));

        // Step 5: Calculate Total Amount
        total = amountAfterDiscount + calculatedTax; // Expected: 90.00
        setTotalAmount(total.toFixed(2));
      } else if (isTaxApplied === "1") {
        // Tax is included in the total amount, so `subtotal` remains rate * quantity
        newSubtotal = totalAmountWithoutAdjustments;
        calculatedDiscount = newSubtotal * (discount / 100);

        // Total amount after applying the discount
        amountAfterDiscount = newSubtotal - calculatedDiscount;

        // Tax is calculated on this adjusted total and added to get the final total
        calculatedTax = amountAfterDiscount * (taxPercent / 100);
        total = amountAfterDiscount + calculatedTax;
      }
    }

    // Set states and update form values
    setSubtotal(newSubtotal);
    CustomOrderform.setFieldValue("subtotal", String(newSubtotal));

    setTaxValue(calculatedTax.toFixed(2));
    CustomOrderform.setFieldValue("taxValue", String(calculatedTax.toFixed(2)));

    setDiscountValue(calculatedDiscount.toFixed(2));
    CustomOrderform.setFieldValue(
      "discountValue",
      String(calculatedDiscount.toFixed(2))
    );

    setTotalAmount(Math.ceil(total));
    CustomOrderform.setFieldValue("totalAmount", String(Math.ceil(total)));

    CustomOrderform.setFieldValue("taxPercent", taxPercent);
  }, [
    rate,
    quantity,
    taxPercent,
    discount,
    isTaxApplied,
    isDiscountApplied,
    // taxType,
    isTaxEnabled,
  ]);

  const fetchMechanics = async () => {
    try {
      const result = await fetchData("/listOfMechanics");
      // Filter services based on the vehicleType
      console.log(result);
      setListMechanic(result?.listOfMechanics);
    } catch (error) {
      message.error("Failed to fetch services");
    }
  };

  const handlePanelToggle = (category) => {
    setIsExpanded((prev) => ({
      ...prev,
      [category]: !prev[category], // Toggle the expanded state for this specific category
    }));
  };

  useEffect(() => {
    fetchMechanics();
    fetchListInspectionDetails();
  }, []);

  const uploadButton = (
    <button
      style={{
        border: 0,
        background: "none",
      }}
      type="button"
    >
      <PlusOutlined />
      <div
        style={{
          marginTop: 8,
        }}
      >
        Upload
      </div>
    </button>
  );

  const handlePreview = async (file) => {
    console.log("fdfdf");
    setPreviewImage(file.url || file.thumbUrl);
    setPreviewOpen(true);
  };

  const handleTaxDropdownChange = (value) => {
    console.log(value.target.value);
    setIsTaxApplied(value.target.value);
    form.setFieldValue("taxType", value.target.value);
  };

  const handleChange1 = ({ file, fileList: newFileList }) => {
    setFileList(newFileList); // Update file list
    console.log(newFileList);
  };

  const beforeUpload = (file) => {
    handleUploadMulti(file); // Call your upload function here
    return false; // Prevent default upload behavior
  };

  const handleDeleteMulti = async (file) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    setFileList(newFileList); // Update the state with the remaining files
    message.success("File deleted successfully."); // Optional message for user
  };

  const handleUploadMulti = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/uploadImage`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data && response.data.imagePath1) {
        // Update the fileList with the uploaded file's URL
        setFileList((prevFileList) =>
          prevFileList.map((f) =>
            f.uid === file.uid
              ? {
                  ...f,
                  url: response.data.imagePath1,
                  status: "done",
                }
              : f
          )
        );
        message.success("File uploaded successfully.");
      }
    } catch (error) {
      message.error("File upload failed.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between pt-2 mx-2 px-2 rounded-lg">
        {/* Immediate Attention Required */}
        <div
          className="flex items-center gap-5 p-2 rounded-md"
          style={{ boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.25)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 border border-[#D10505] rounded-full">
              <span className="w-3 h-3 bg-[#D10505] rounded-full"></span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Immediate Attention Required
            </span>
          </div>
          {/* Future Attention Required */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 border border-[#E6BB4E] rounded-full">
              <span className="w-3 h-3 bg-[#E6BB4E] rounded-full"></span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Future Attention Required
            </span>
          </div>

          {/* Inspected & Okay */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 border border-[#218A07] rounded-full">
              <span className="w-3 h-3 bg-[#218A07] rounded-full"></span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Inspected & Okay
            </span>
          </div>

          {/* None */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 border border-[#707070] rounded-full">
              <span className="w-3 h-3 bg-[#707070] rounded-full"></span>
            </div>
            <span className="text-sm font-medium text-gray-700">None</span>
          </div>
        </div>
        {/* Skip & Next Button */}
        <Button
          className="ml-auto px-4 py-3 bg-[#8E8E93] text-[#fff] font-medium rounded-lg hover:bg-gray-300"
          onClick={handleNext}
        >
          Skip & Next
        </Button>
      </div>
      <div
        className="rounded-lg p-3 m-3 bg-white"
        style={{ boxShadow: "0 0 3px 0 rgba(0, 0, 0, 0.25)" }}
      >
        <div>
          <Form
            layout="vertical"
            onFinish={onFinish2}
            form={form}
            preserve
            className="client-details-form"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "2%",
                margin: "14px",
              }}
            >
              <div
                className="border-0 rounded-lg dashboard"
                style={{
                  flexBasis: "50%",
                  height: "61vh",
                  backgroundColor: "white",
                  padding: "20px",
                  overflowY: "auto",
                  boxShadow: "0 0 3px 0 rgba(0, 0, 0, 0.25)",
                }}
              >
                <div style={{ width: "100%" }} className="pb-2 pl-2 pr-2">
                  <h1 level={4} className="font-bold text-lg pb-3">
                    Inspection Report
                  </h1>
                  <div>
                    <Form.Item
                      name="mechanicName"
                      initialValue={vehicleCondition?.mechanicName}
                      rules={[
                        {
                          required: true,
                          message: "Please select mechanic",
                        },
                      ]}
                    >
                      <TextField
                        select
                        label={
                          <span>
                            <SearchOutlined style={{ marginRight: 8 }} />{" "}
                            Inspection done by *
                          </span>
                        }
                        placeholder="Select mechanic name"
                        value={mechanic} // Controlled value
                        onChange={(e) => setMechanic(e.target.value)} // Handle selection change
                        fullWidth
                        variant="outlined"
                        sx={{ marginBottom: 2, height: 20 }}
                        size="small"
                      >
                        <MenuItem value="">
                          <em>Select mechanic name</em>
                        </MenuItem>

                        {listMechanic?.map((mechanic) => (
                          <MenuItem key={mechanic?._id} value={mechanic?._id}>
                            {mechanic?.mechanicName}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Form.Item>

                    {/* Map through inspection categories */}
                    {inspectionData?.map((category) => (
                      <Collapse
                        onChange={() => handlePanelToggle(category.name)}
                        style={{
                          padding: 0,
                          border: "none",
                          borderRadius: "0px 0px 4px 4px",
                          boxShadow: "0px 4px 2px 0px rgba(0, 0, 0, 0.25)",
                        }}
                        key={category.name}
                      >
                        <Panel
                          header={
                            <div className="panel-header flex justify-between">
                              <span>{category.name}</span>
                              <span className="expand-icon">
                                {isExpanded[category.name] ? (
                                  <FaChevronDown />
                                ) : (
                                  <FaChevronUp />
                                )}
                              </span>
                            </div>
                          }
                          key={category.name}
                          className="custom-panel-header"
                          style={{ padding: 0, border: "none" }}
                          showArrow={false}
                        >
                          <List
                            className="scrollable-list"
                            dataSource={category.inspections}
                            renderItem={(item) => (
                              <List.Item className="" style={{ padding: 0 }}>
                                <div className="flex flex-col p-2 w-full">
                                  <div className="flex justify-between p-2">
                                    <div className="w-[50%]">
                                      <span>{item.inspectionName}</span>
                                    </div>

                                    <Space
                                      direction="vertical"
                                      className="w-[30%]"
                                    >
                                      <Radio.Group
                                        defaultValue={"0"}
                                        onChange={(e) => {
                                          handleStatusSelection(
                                            e.target.value,
                                            item
                                          );
                                          setExpandedItem(item._id);
                                        }}
                                      >
                                        <Radio
                                          value="3"
                                          className="custom-red"
                                        />
                                        <Radio
                                          value="2"
                                          className="custom-yellow"
                                        />
                                        <Radio
                                          value="1"
                                          className="custom-green"
                                        />
                                        <Radio
                                          value="0"
                                          className="custom-black"
                                        />
                                      </Radio.Group>
                                    </Space>

                                    <Space>
                                      {uploadedImages[item._id] &&
                                      visibilityState[item._id] ? (
                                        <EyeInvisibleOutlined
                                          className="text-lg"
                                          onClick={() =>
                                            toggleVisibility(item._id)
                                          }
                                        />
                                      ) : (
                                        <EyeOutlined
                                          className="text-lg"
                                          onClick={() =>
                                            toggleVisibility(item._id)
                                          }
                                        />
                                      )}

                                      <UploadOutlined
                                        className="text-lg"
                                        onClick={() =>
                                          document
                                            .getElementById(
                                              `fileInput-${item._id}`
                                            )
                                            .click()
                                        }
                                      />
                                      <input
                                        type="file"
                                        id={`fileInput-${item._id}`}
                                        style={{ display: "none" }}
                                        onChange={(e) =>
                                          handleImageUpload(e, item._id)
                                        }
                                        accept="image/*"
                                      />

                                      {uploadedImages[item._id] &&
                                        visibilityState[item._id] && (
                                          <div>
                                            <img
                                              src={uploadedImages[item._id]}
                                              alt="Uploaded"
                                              style={{
                                                maxWidth: "25px",
                                                height: "auto",
                                                cursor: "pointer",
                                              }}
                                              onClick={() =>
                                                handleImageClick(
                                                  uploadedImages[item._id]
                                                )
                                              }
                                            />
                                          </div>
                                        )}
                                    </Space>
                                  </div>

                                  {expandedItem === item._id &&
                                    (stat === "2" || stat === "3") && (
                                      <Space
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Button
                                          onClick={() => {
                                            handleServiceSelection(item);
                                            handleAddService();
                                          }}
                                          className="bg-primary text-white"
                                        >
                                          + Add Service
                                        </Button>
                                        <Button
                                          className="bg-white text-primary border border-primary"
                                          onClick={() => setAddNotesModal(true)}
                                        >
                                          + Add Notes
                                        </Button>
                                      </Space>
                                    )}
                                </div>
                              </List.Item>
                            )}
                          />
                        </Panel>
                      </Collapse>
                    ))}

                    {clickedImage && (
                      <Modal
                        visible={true}
                        onCancel={handleModalClose}
                        footer={null}
                        centered
                        width={200}
                      >
                        <img
                          src={clickedImage}
                          alt="Expanded"
                          style={{
                            maxWidth: "100%",
                            height: "150px",
                            width: "150px",
                            objectFit: "cover",
                          }}
                        />
                      </Modal>
                    )}

                    <div className="p-2 custom-panel-header">
                      <div className="flex justify-between pb-2">
                        <h1 className="text-lg font-bold">Add Images</h1>
                      </div>
                      <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onPreview={handlePreview}
                        onChange={handleChange1}
                        beforeUpload={beforeUpload}
                        onRemove={handleDeleteMulti}
                        className="custom-upload-list"
                        style={{ width: "100px", height: "100px" }}
                        itemRender={(originNode) => (
                          <div
                            style={{
                              width: "60px",
                              height: "60px",
                              overflow: "hidden",
                            }}
                          >
                            {originNode}
                          </div>
                        )}
                      >
                        {fileList.length >= 100 ? null : uploadButton}
                      </Upload>

                      {previewImage && (
                        <Image
                          width={10}
                          wrapperStyle={{ display: "none" }}
                          preview={{
                            visible: previewOpen,
                            onVisibleChange: (visible) =>
                              setPreviewOpen(visible),
                            afterOpenChange: (visible) =>
                              !visible && setPreviewImage(""),
                          }}
                          src={previewImage}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="border-0 rounded-lg dashboard"
                style={{
                  flexBasis: "40%",
                  height: "61vh",
                  backgroundColor: "white",
                  padding: "20px",
                  overflowY: "auto",
                  boxShadow: "0 0 3px 0 rgba(0, 0, 0, 0.25)",
                }}
              >
                <div className="flex flex-col" style={{ width: "100%" }}>
                  <h1
                    level={4}
                    style={{
                      marginBottom: "10px",
                      fontWeight: "bold",
                      fontSize: 18,
                    }}
                  >
                    Added Checkpoints
                  </h1>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "bold",
                      padding: "10px 0",
                      borderBottom: "2px solid #eaeaea",
                    }}
                  >
                    {/* <div style={{ flex: 0.5 }}>Status</div> */}

                    <div style={{ flex: 2 }}>Added Ones</div>
                    <div style={{ flex: 0.5 }}>Rate</div>

                    <div style={{ flex: 1 }}>Quantity</div>
                    <div style={{ flex: 0.5 }}>Action</div>
                  </div>
                  <div
                    className="dashboard"
                    style={{
                      maxHeight: "260px",
                      minHeight: "260px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      marginTop: "10px",
                      paddingRight: "10px",
                    }}
                  >
                    {addedCheckpoints?.length > 0 ? (
                      addedCheckpoints
                        ?.filter((item) => item.status)
                        ?.map((item, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "2px",
                            }}
                          >
                            <div style={{ flex: 2 }}>
                              <h5 strong>
                                {item?.serviceName ||
                                  item?.partName ||
                                  item?.packageName}
                              </h5>
                            </div>
                            <div style={{ flex: 0.5 }}>
                              <span style={{ fontSize: "16px" }}>
                                {item.totalAmount}
                              </span>
                            </div>
                            <div style={{ flex: 1, textAlign: "center" }}>
                              <h4 type="secondary">{item.quantity || 1}</h4>
                            </div>

                            <div style={{ flex: 0.5, textAlign: "right" }}>
                              <Button
                                type="text"
                                icon={
                                  <MinusCircleOutlined
                                    style={{ fontSize: "15px", color: "black" }}
                                  />
                                }
                                onClick={() => handleRemove(index, item)}
                              />
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="flex items-center justify-center w-full min-h-[200px] ">
                        <h5 className="text-md font-medium">
                          No checkpoints have been added yet
                        </h5>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "24px",
                    display: "flex",
                    justifyContent: "end",
                    alignItems: "end",
                    gap: 10,
                  }}
                >
                  <Button
                    className="border border-primary text-primary font-semibold"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    className="font-semibold"
                    htmlType="submit"
                  >
                    Save & Next
                  </Button>
                </div>
              </div>
            </div>
          </Form>
          <Modal
            width={420}
            title="Select Services"
            visible={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
          >
            <div className="border-0 dashboard w-[100%] h-[68vh] p-3 overflow-y-auto dashboard">
              <div className="mx-auto flex justify-center my-4 gap-1">
                {["CustomOrder", "Services", "Parts", "Packages"]?.map(
                  (tab) => (
                    <Button
                      key={tab}
                      variant={currentTab === tab ? "contained" : "outlined"}
                      onClick={() => handleTabChange(tab)}
                      className="border-2"
                      style={{
                        color: currentTab === tab ? "#fff" : "#b11226",
                        backgroundColor:
                          currentTab === tab ? "#b11226" : "transparent",
                        borderColor: "#b11226",
                      }}
                    >
                      {tab}
                    </Button>
                  )
                )}
              </div>

              {/* Custom Order Form */}

              <Form
                layout="vertical"
                className="client-details-form"
                initialValues={{
                  quantity: quantity,
                  taxPercent: taxPercent,
                  taxType: isTaxApplied,
                  applyDiscount: isDiscountApplied,
                  applyTax: isTaxEnabled,
                }}
                style={{ marginTop: 24 }}
                onFinish={
                  currentTab === "CustomOrder"
                    ? handleAddServiceJob
                    : handleAddServiceJob1
                }
                form={CustomOrderform}
              >
                {currentTab === "CustomOrder" && (
                  <>
                    <Form.Item
                      style={{ width: "100%" }}
                      name="service"
                      rules={[
                        { required: true, message: "Please select a service!" },
                      ]}
                    >
                      <TextField
                        label="Custom Order *"
                        variant="outlined" 
                        fullWidth
                        size="small"
                        value={customOrder}
                        onChange={(e) => setCustomOrder(e.target.value)}
                        InputProps={{
                          style: { height: 40 },
                        }}
                      />
                    </Form.Item>
                    <div className="flex gap-2">
                      <Form.Item
                        style={{ width: "100%" }}
                        name="quantity"
                        rules={[
                          {
                            required: false,
                            message: "Please enter the quantity!",
                          },
                        ]}
                      >
                        <TextField
                          label="Quantity *"
                          variant="outlined"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          type="number"
                          size="small"
                          value={quantity}
                          onChange={() => {}} 
                          InputProps={{
                            style: { height: 40 },
                            readOnly: true,
                          }}
                          inputProps={{ min: 0 }}
                          onKeyDown={(e) => {
                            if (e.key === "-" || e.key === "e") {
                              e.preventDefault();
                            }
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        style={{ width: "100%" }}
                        name="hsn"
                      >
                        <TextField
                          label="HSN/SAC"
                          variant="outlined" 
                          fullWidth
                          type="number"
                          size="small"
                          value={hsn}
                          onChange={(e) => setHsn(e.target.value)}
                          InputProps={{
                            style: { height: 40 }, 
                          }}
                        />
                      </Form.Item>
                    </div>
                    <div className="flex justify-end">
                      <Form.Item name="applyTax" valuePropName="checked">
                        <div className="flex flex-row items-center gap-2">
                          <Switch
                            checked={isTaxEnabled}
                            onChange={() => {
                              setIsTaxEnabled(!isTaxEnabled);
                              CustomOrderform.setFieldsValue({
                                applyTax: !isTaxEnabled,
                              });
                            }}
                            style={{
                              backgroundColor: isTaxEnabled
                                ? "#b11226"
                                : "#d9d9d9",
                            }}
                          />
                          <p>Apply Tax</p>
                        </div>
                      </Form.Item>
                    </div>
                    <div className="flex gap-2">
                      <Form.Item
                        style={{ width: "100%" }}
                        name="rate"
                        rules={[
                          { required: true, message: "Please enter the rate!" },
                        ]}
                      >
                        <TextField
                          label="Rate *"
                          variant="outlined" // You can use "outlined", "filled", or "standard" variants
                          fullWidth
                          placeholder="Rate"
                          type="number"
                          size="small"
                          value={rate}
                          onChange={handleRateChange}
                          InputProps={{
                            style: { height: 40 }, // Adjusting height if necessary
                          }}
                          onKeyDown={(e) => {
                            // Prevent the input of negative sign or exponential notation
                            if (e.key === "-" || e.key === "e") {
                              e.preventDefault();
                            }
                          }}
                          inputProps={{ min: 0 }}
                        />
                      </Form.Item>

                      <Form.Item
                        // label='Tax Type'
                        name="taxType"
                        value={isTaxApplied}
                        style={{ width: "100%" }}
                      >                        
                        <TextField
                          select
                          label="Tax Type"
                          variant="outlined" // You can use "outlined", "filled", or "standard" as needed
                          fullWidth
                          size="small"
                          value={isTaxApplied}
                          onChange={handleTaxDropdownChange}
                          disabled={!isTaxEnabled}
                          defaultValue="0"
                          InputProps={{
                            style: { height: 40 }, // Ensures height matches the original design
                          }}
                        >
                          {/* Options */}
                          <MenuItem value="0">With Tax</MenuItem>
                          <MenuItem value="1">Without Tax</MenuItem>
                        </TextField>
                      </Form.Item>
                    </div>
                    <div className=" flex justify-end">
                      <Form.Item name="applyDiscount" valuePropName="checked">
                        <div className="flex flex-row items-center gap-2">
                          <Switch
                            checked={isDiscountApplied}
                            onChange={() => {
                              setIsDiscountApplied(!isDiscountApplied);
                              CustomOrderform.setFieldsValue({
                                applyDiscount: !isDiscountApplied,
                              });
                            }}
                            style={{
                              backgroundColor: isDiscountApplied
                                ? "#b11226"
                                : "#d9d9d9",
                            }}
                          />
                          <p>Apply Discount</p>
                        </div>
                      </Form.Item>
                    </div>
                    <div className="flex justify-between">
                      <p>Subtotal</p>
                      <Form.Item name="subtotal" style={{ width: "50%" }}>
                        <Input
                          style={{ height: 45 }}
                          placeholder="Subtotal (Rate * Qty)"
                          value={`${subtotal.toFixed(2)}`}
                          disabled
                        />
                        <p style={{ display: "none" }}>{subtotal}</p>
                      </Form.Item>
                    </div>

                    <div className="flex justify-between">
                      {isTaxEnabled && (
                        <>
                          <p> Tax</p>
                          <div
                            className="flex justify-between gap-2"
                            style={{ width: "50%" }}
                          >
                            <Form.Item name="taxPercent" style={{ flex: 1 }}>
                              <Select
                                style={{ height: 45 }}
                                defaultValue={"5"}
                                value={taxPercent}
                                onChange={(value) => setTaxPercent(value)}
                              >
                                <Option value={"5"}>5%</Option>
                                <Option value={"12"}>12%</Option>
                                <Option value={"18"}>18%</Option>
                                <Option value={"28"}>28%</Option>
                              </Select>
                            </Form.Item>

                            <Form.Item name="taxValue" style={{ flex: 1 }}>
                              <Input
                                style={{ height: 45 }}
                                placeholder="Tax Value"
                                disabled
                                value={taxValue}
                              />
                              <p style={{ display: "none" }}>{taxValue}</p>
                            </Form.Item>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-between">
                      {isDiscountApplied && (
                        <>
                          <p>Discount</p>
                          <div className="flex gap-2" style={{ width: "50%" }}>
                            <Form.Item
                              name="discountPercent"
                              rules={[
                                {
                                  required: isDiscountApplied,
                                  message: "Discount percent is required",
                                },
                              ]}
                              style={{ flex: 1 }}
                            >
                              <Input
                                placeholder="Discount %"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                style={{ height: 45 }}
                              />
                            </Form.Item>

                            <Form.Item name="discountValue" style={{ flex: 1 }}>
                              <Input
                                style={{ height: 45 }}
                                placeholder="Discount Value"
                                disabled
                                value={discountValue}
                              />
                              <p style={{ display: "none" }}>{discountValue}</p>
                            </Form.Item>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <h1 className="text-primary font-bold text-lg">Amount</h1>
                      <div className="flex gap-2" style={{ width: "50%" }}>
                        <Form.Item name="totalAmount" style={{ flex: 1 }}>
                          <Input
                            placeholder="Amount"
                            value={totalAmount}
                            disabled
                            style={{ height: 45 }}
                          />
                          <p style={{ display: "none" }}>{discountValue}</p>
                        </Form.Item>
                      </div>
                    </div>
                  </>
                )}

                {currentTab === "Services" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <TextField
                        // label='Search Services'
                        label={
                          <span>
                            <SearchOutlined style={{ marginRight: 8 }} /> Search
                            Services
                          </span>
                        }
                        variant="outlined" // You can use "outlined", "filled", or "standard" variants
                        fullWidth
                        type="text"
                        size="small"
                        value={servicesSearch}
                        onChange={(e) => setServicesSearch(e.target.value)}
                        InputProps={{
                          style: { height: 40 }, // Adjusting height if necessary
                        }}
                      />
                    </div>

                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {servicesList
                        ?.filter((service) =>
                          service.serviceName
                            .toLowerCase()
                            .includes(servicesSearch.toLowerCase())
                        )
                        ?.map((service, index) => {
                          // Check if the current service is in addedCheckpoints and has status: true
                          const isChecked = addedCheckpoints.some(
                            (item) =>
                              item.serviceId === service._id &&
                              item.status === true
                          );

                          return (
                            <div
                              key={service._id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
                              }}
                            >
                              {/* Checkbox to handle selection */}
                              <Checkbox
                                checked={isChecked}
                                onChange={(e) =>
                                  handleCheckboxChange(e, service, "service")
                                }
                              >
                                {service.serviceName || "-"}
                              </Checkbox>
                              <span>₹ {service.totalAmount || "-"}</span>
                            </div>
                          );
                        })}
                      {/* Show message if no services match the search */}
                      {servicesList.filter((service) =>
                        service.serviceName
                          .toLowerCase()
                          .includes(servicesSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="flex items-center justify-center w-full h-full min-h-[40vh]">
                          <p>No matching services found.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {/* Parts Tab */}
                {currentTab === "Parts" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <TextField
                        // label='Search Services'
                        label={
                          <span>
                            <SearchOutlined style={{ marginRight: 8 }} /> Search
                            Parts
                          </span>
                        }
                        variant="outlined" // You can use "outlined", "filled", or "standard" variants
                        fullWidth
                        type="text"
                        size="small"
                        value={partsSearch}
                        onChange={(e) => setPartsSearch(e.target.value)}
                        InputProps={{
                          style: { height: 40 }, // Adjusting height if necessary
                        }}
                      />
                    </div>

                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {partList
                        ?.filter((part) =>
                          part.partName
                            .toLowerCase()
                            .includes(partsSearch.toLowerCase())
                        )
                        ?.map((service) => {
                          const isChecked = addedCheckpoints.some(
                            (item) =>
                              item.serviceId === service._id &&
                              item.status === true
                          );

                          return (
                            <div
                              key={service._id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
                              }}
                            >
                              <Checkbox
                                checked={isChecked}
                                onChange={(e) =>
                                  handleCheckboxChange(e, service, "part")
                                }
                              >
                                {service.partName}
                              </Checkbox>
                              <span>₹ {service.rate}</span>
                            </div>
                          );
                        })}
                      {/* Show message if no services match the search */}
                      {partList.filter((part) =>
                        part.partName
                          .toLowerCase()
                          .includes(partsSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="flex items-center justify-center w-full h-full min-h-[40vh]">
                          <p>No matching parts found.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Packages Tab */}
                {currentTab === "Packages" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <TextField
                        // label='Search Services'
                        label={
                          <span>
                            <SearchOutlined style={{ marginRight: 8 }} /> Search
                            Packages
                          </span>
                        }
                        variant="outlined" // You can use "outlined", "filled", or "standard" variants
                        fullWidth
                        type="text"
                        size="small"
                        value={packagesSearch}
                        onChange={(e) => setPackagesSearch(e.target.value)}
                        InputProps={{
                          style: { height: 40 }, // Adjusting height if necessary
                        }}
                      />
                    </div>

                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {packagesList
                        ?.filter((pack) =>
                          pack.packageName
                            ?.toLowerCase()
                            ?.includes(packagesSearch.toLowerCase())
                        )
                        ?.map((service) => {
                          const isChecked = addedCheckpoints.some(
                            (item) =>
                              item.serviceId === service._id &&
                              item.status === true
                          );

                          return (
                            <div
                              key={service._id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
                              }}
                            >
                              <Checkbox
                                checked={isChecked}
                                onChange={(e) =>
                                  handleCheckboxChange(e, service, "package")
                                }
                              >
                                {service.packageName}
                              </Checkbox>
                              <span>₹ {service.totalAmount}</span>
                            </div>
                          );
                        })}
                      {packagesList.filter((pack) =>
                        pack?.packageName
                          ?.toLowerCase()
                          ?.includes(packagesSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="flex items-center justify-center w-full h-full min-h-[40vh]">
                          <p>No matching packages found.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {currentTab === "CustomOrder" && (
                  <div
                    className="flex justify-center gap-4"
                    style={{ marginTop: 24 }}
                  >
                    <Button
                      type="default"
                      onClick={() => console.log("Back clicked")}
                    >
                      Back
                    </Button>
                    <Button
                      htmlType="submit"
                      type="primary"
                      style={{
                        backgroundColor: "#b11226",
                        borderColor: "#b11226",
                      }}
                      // onClick={() => handleAddService1(selectedServices)}
                    >
                      Save
                    </Button>
                  </div>
                )}
                {currentTab === "CustomOrder" ? (
                  ""
                ) : (
                  <div
                    className="flex justify-center gap-4"
                    style={{ marginTop: 24 }}
                  >
                    <Button
                      type="primary"
                      onClick={() => setIsModalVisible(false)}
                      style={{
                        backgroundColor: "#b11226",
                        borderColor: "#b11226",
                      }}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </Form>
            </div>
          </Modal>
          <Modal
            title="Add Notes"
            maxWidth={200}
            centered
            visible={addNotesModal}
            onCancel={() => setAddNotesModal(false)}
            footer={
              <div className="flex justify-center">
                <Button className="px-8" key="ok" type="primary">
                  OK
                </Button>
              </div>
            }
          >
            <div className="border border-[black] my-2 mb-3"></div>
            <TextArea
              value={addNotes}
              rows={4}
              maxLength={150}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="Add your note"
            />
          </Modal>
        </div>
        <Modal
          showHeader={false}
          visible={isPdfModalVisible}
          onCancel={handlePdfCloseModal}
          footer={
            <div className="flex justify-center gap-4">
              <Button onClick={handlePdfCloseModal}>Back</Button>
              <Button type="primary" onClick={handleContinue}>
                Continue
              </Button>
            </div>
          }
          width="80%"
        >
          {pdfUrl && (
            <PDFViewer pdfProps={pdfUrl} onBack={handlePdfCloseModal} />
          )}
        </Modal>

        <ConfirmationModal
          visible={isConfirmationVisible}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmationVisible(false)}
        />
        <SuccessModal visible={isSuccessVisible} onOk={handleSuccessOk} />
      </div>
    </>
  );
};

export default InspectionReport;
