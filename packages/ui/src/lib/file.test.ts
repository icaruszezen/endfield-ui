import { describe, expect, it } from "vitest";
import { fileExtension, formatFileSize, matchesAccept, sameFile } from "./file";

const file = (name: string, type = "") => ({ name, type });

describe("matchesAccept", () => {
  it("没写 accept 就是都行", () => {
    expect(matchesAccept(file("a.exe"), undefined)).toBe(true);
    expect(matchesAccept(file("a.exe"), "")).toBe(true);
    expect(matchesAccept(file("a.exe"), " , ")).toBe(true);
  });

  it("扩展名：不分大小写，认的是结尾", () => {
    expect(matchesAccept(file("报告.PDF"), ".pdf")).toBe(true);
    expect(matchesAccept(file("报告.pdf.exe"), ".pdf")).toBe(false);
    expect(matchesAccept(file("archive.tar.gz"), ".tar.gz")).toBe(true);
  });

  it("一类：image/* 认所有图片", () => {
    expect(matchesAccept(file("a.png", "image/png"), "image/*")).toBe(true);
    expect(matchesAccept(file("a.svg", "image/svg+xml"), "image/*")).toBe(true);
    expect(matchesAccept(file("a.pdf", "application/pdf"), "image/*")).toBe(
      false,
    );
    // 没有类型的文件不能靠通配混进来
    expect(matchesAccept(file("a.png"), "image/*")).toBe(false);
  });

  it("一种：要一字不差", () => {
    expect(matchesAccept(file("a.txt", "text/plain"), "text/plain")).toBe(true);
    expect(matchesAccept(file("a.csv", "text/csv"), "text/plain")).toBe(false);
  });

  it("几条规则合一条就行；空格不碍事", () => {
    const accept = ".pdf, image/* ,TEXT/PLAIN";
    expect(matchesAccept(file("a.pdf"), accept)).toBe(true);
    expect(matchesAccept(file("a.jpg", "image/jpeg"), accept)).toBe(true);
    expect(matchesAccept(file("a.txt", "text/plain"), accept)).toBe(true);
    expect(matchesAccept(file("a.zip", "application/zip"), accept)).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("字节不带小数", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1)).toBe("1 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("按 1024 进位；不到 100 的留一位小数，.0 不写", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10 MB");
    expect(formatFileSize(1.25 * 1024 * 1024)).toBe("1.3 MB");
    expect(formatFileSize(99.94 * 1024)).toBe("99.9 KB");
  });

  it("到了 100 就取整", () => {
    expect(formatFileSize(128.4 * 1024)).toBe("128 KB");
    expect(formatFileSize(512 * 1024 * 1024)).toBe("512 MB");
  });

  it("取整之后够 1024 了就进一位，不写成 1024 KB", () => {
    expect(formatFileSize(1024 * 1024 - 1)).toBe("1 MB");
    expect(formatFileSize(1023.6 * 1024)).toBe("1 MB");
  });

  it("最大的单位是 TB；不像样的数给空串", () => {
    expect(formatFileSize(3 * 1024 ** 4)).toBe("3 TB");
    expect(formatFileSize(5000 * 1024 ** 4)).toBe("5000 TB");
    expect(formatFileSize(-1)).toBe("");
    expect(formatFileSize(Number.NaN)).toBe("");
  });
});

describe("fileExtension", () => {
  it("取最后一个点后面的，大写", () => {
    expect(fileExtension("报告.pdf")).toBe("PDF");
    expect(fileExtension("report.final.Docx")).toBe("DOCX");
    expect(fileExtension("archive.tar.gz")).toBe("GZ");
  });

  it("没有扩展名、点在开头或结尾、长得不像扩展名的，都是空的", () => {
    expect(fileExtension("README")).toBe("");
    expect(fileExtension(".gitignore")).toBe("");
    expect(fileExtension("结尾是点.")).toBe("");
    expect(fileExtension("第 3.5 版说明")).toBe("");
    expect(fileExtension("a.verylongext")).toBe("");
  });
});

describe("sameFile", () => {
  it("名字、大小、修改时间都一样才算同一个", () => {
    const a = new File(["abc"], "a.txt", { lastModified: 1 });
    expect(sameFile(a, new File(["xyz"], "a.txt", { lastModified: 1 }))).toBe(
      true,
    );
    expect(sameFile(a, new File(["abc"], "b.txt", { lastModified: 1 }))).toBe(
      false,
    );
    expect(sameFile(a, new File(["abcd"], "a.txt", { lastModified: 1 }))).toBe(
      false,
    );
    expect(sameFile(a, new File(["abc"], "a.txt", { lastModified: 2 }))).toBe(
      false,
    );
  });
});
