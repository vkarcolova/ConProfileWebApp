export const basicButtonStyle = {
  borderRadius: "8px",
  boxShadow: "rgba(213, 217, 217, 0.5) 0 2px 5px 0",
  fontFamily: '"Amazon Ember", sans-serif',
  fontSize: "12px",
  width: "80%",
  textTransform: "none",
  fontWeight: "bold",
};

export const lightButtonStyle = {
  backgroundColor: "#fff",
  border: "1px solid #d5d9d9",
  color: "#0f1111",

  "&:hover": {
    backgroundColor: "#f7fafa",
    borderColor: "#b0b0b0",
  },
};

export const darkButtonStyle = {
  backgroundColor: "#222122;",
  border: "1px solid #222122",
  "&:hover": {
    backgroundColor: "#6d6a6d",
  },
};

export const emptyTable = {
  minWidth: "100%",
  minHeight: "45vh",
  backgroundColor: "#f7f6f6",
};
