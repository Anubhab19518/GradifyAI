import axios from "axios";

export const CreateQuestionPaper = async (formData) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/papers/create/question-paper`,
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
