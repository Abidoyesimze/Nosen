export const success = (res: any, data: any, message = "Success") => {
  return res.status(200).json({ success: true, message, data });
};

export const failure = (res: any, message = "Something went wrong", code = 400) => {
  return res.status(code).json({ success: false, message });
};
