export const getTodayAndXDateFormatted = (years: number) => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    const xYearsAgo = new Date();
    xYearsAgo.setFullYear(today.getFullYear() - years); 
    xYearsAgo.setMonth(0); // January (months are 0-indexed)
    xYearsAgo.setDate(1);
    const xYearsAgoFormatted = xYearsAgo.toISOString().split('T')[0];
    return [todayFormatted, xYearsAgoFormatted];
}