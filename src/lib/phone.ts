export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function toCustomerPhoneKey(phone: string) {
  let digits = normalizePhone(phone);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (digits.startsWith("0") && digits.length > 10) {
      digits = digits.slice(1);
      continue;
    }

    if (digits.startsWith("55") && digits.length > 11) {
      digits = digits.slice(2);
      continue;
    }

    break;
  }

  return digits;
}

export function getPhoneLookupVariants(phone: string) {
  const digits = normalizePhone(phone);
  if (!digits) {
    return [];
  }

  const variants = new Set<string>([toCustomerPhoneKey(phone)]);
  const queue = [digits];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || variants.has(current)) {
      continue;
    }

    variants.add(current);

    if (current.startsWith("0") && current.length > 10) {
      queue.push(current.slice(1));
    }

    if (current.startsWith("55") && current.length > 11) {
      queue.push(current.slice(2));
    }
  }

  for (const current of Array.from(variants)) {
    if (
      (current.length === 10 || current.length === 11) &&
      !current.startsWith("55")
    ) {
      variants.add(`55${current}`);
    }

    if (
      (current.length === 10 || current.length === 11) &&
      !current.startsWith("0")
    ) {
      variants.add(`0${current}`);
    }
  }

  return Array.from(variants);
}

export function phonesMatch(leftPhone: string, rightPhone: string) {
  const leftVariants = new Set(getPhoneLookupVariants(leftPhone));
  if (leftVariants.size === 0) {
    return false;
  }

  return getPhoneLookupVariants(rightPhone).some((variant) =>
    leftVariants.has(variant),
  );
}

export function maskPhone(phone: string) {
  const digits = normalizePhone(phone);

  if (digits.length < 4) {
    return phone;
  }

  if (digits.length >= 12 && digits.startsWith("55")) {
    const nationalDigits = digits.slice(2);
    return maskPhone(nationalDigits);
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`;
  }

  return `Final ${digits.slice(-4)}`;
}
