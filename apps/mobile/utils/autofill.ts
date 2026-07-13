import { Platform, type TextInputProps } from "react-native";

type AutofillProps = Pick<
  TextInputProps,
  "autoComplete" | "textContentType" | "importantForAutofill"
>;

function withAndroidAutofill(props: AutofillProps): AutofillProps {
  if (Platform.OS !== "android") return props;
  return { ...props, importantForAutofill: "yes" };
}

/** Full name (patient / profile registration). */
export const nameAutofill = withAndroidAutofill({
  autoComplete: "name",
  textContentType: "name",
});

/** Local phone digits without country code (+251 prefix shown separately). */
export const phoneNationalAutofill = withAndroidAutofill({
  autoComplete: "tel-national",
  textContentType: "telephoneNumber",
});

/** SMS one-time code (OTP verification). */
export const smsOtpAutofill = withAndroidAutofill({
  autoComplete: "sms-otp",
  textContentType: "oneTimeCode",
});
