import axios from "axios";

export const CreateQuestionPaper = async (formData) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/papers/create/question-paper",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating question paper:", error);
    throw error;
  }
};
