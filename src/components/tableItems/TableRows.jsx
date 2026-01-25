import React from "react";

const TableRows = (props) => {
    const { processedStudents, columns, } = props;



    return (
        <>
            {processedStudents.length === 0 ? (
                <tr>
                    <td>1</td>
                    <td>KMU-001</td>
                    <td>Student Name</td>
                    <td>Father Name</td>
                    <td>REG-2024</td>
                    <td>Discipline Name</td>
                    <td>KMU IHS-Swat</td>

                    {columns.map((item, i) => (
                        <React.Fragment key={i}>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </React.Fragment>
                    ))}
                </tr>
            ) : (
                processedStudents.map((student, index) => {
                    let subjectSet = []
                    if (student.subjects) {
                        subjectSet = new Set(student?.subjects.map(s => String(s).trim().toLowerCase()));
                    }

                    return (
                        <tr
                            key={student.rollNumber + index}
                            className={student.isRA ? "ra-row" : ""}
                            style={{ textWrap: 'nowrap' }}
                        >
                            {/* ✅ CUSTOM SERIAL */}
                            <td>{student.serial}</td>

                            {/* ✅ ROLL NUMBER + RA FLAG */}
                            <td>{student.rollNumber}</td>

                            <td>{student.name}</td>
                            <td>{student.fatherName}</td>
                            <td>{student.registration}</td>
                            <td>{student.Discipline}</td>
                            <td>{student.institute}</td>

                            {student.subjects ? columns.map((item, i) => (
                                <React.Fragment key={i}>
                                    <td>{subjectSet.has(String(item.label).trim().toLowerCase()) ? '-' : 'NA'}</td>
                                    <td>{subjectSet.has(String(item.label).trim().toLowerCase()) ? '-' : 'NA'}</td>
                                    <td>{subjectSet.has(String(item.label).trim().toLowerCase()) ? '-' : 'NA'}</td>
                                </React.Fragment>
                            )) : columns.map((item, i) => (
                                <React.Fragment key={i}>
                                    <td>-</td>
                                    <td>-</td>
                                    <td>-</td>
                                </React.Fragment>
                            ))}
                        </tr>
                    )
                }))
            }
        </>
    )
}

export default TableRows